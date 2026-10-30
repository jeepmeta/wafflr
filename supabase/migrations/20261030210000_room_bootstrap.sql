-- Wafflr room bootstrap: rooms, anonymous participants, and guarded room-code joins.
-- Draft migration. Review against the target Supabase project before applying.
-- This file is not deployed by committing it to the repository.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rooms (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(title) between 1 and 80),
  template text not null check (template in ('restaurant', 'movie', 'activity', 'custom')),
  mode text not null check (mode in ('host', 'guests')),
  cards_per_guest smallint,
  phase text not null default 'collecting'
    check (phase in ('collecting', 'voting', 'round_reveal', 'completed', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint guest_mode_quota check (
    (mode = 'guests' and cards_per_guest between 1 and 3)
    or (mode = 'host' and cards_per_guest is null)
  )
);

create table if not exists public.room_participants (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  credential_hash bytea not null,
  role text not null check (role in ('creator', 'guest')),
  joined_at timestamptz not null default now(),
  unique (room_id, credential_hash)
);

-- One rolling attempt bucket per source address and normalized code.
create table if not exists public.room_join_attempts (
  source_hash bytea not null,
  code text not null,
  window_started_at timestamptz not null,
  attempt_count smallint not null,
  primary key (source_hash, code)
);

create index if not exists room_participants_room_id_idx on public.room_participants(room_id);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists room_join_attempts_window_idx on public.room_join_attempts(window_started_at);

alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_join_attempts enable row level security;

revoke all on public.rooms from public, anon, authenticated;
revoke all on public.room_participants from public, anon, authenticated;
revoke all on public.room_join_attempts from public, anon, authenticated;

-- Generate six characters from the full A-Z/0-9 alphabet using rejection
-- sampling, avoiding modulo bias and the hex-only alphabet used in the first draft.
create or replace function public.wafflr_generate_room_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result_code text := '';
  random_byte integer;
begin
  while char_length(result_code) < 6 loop
    random_byte := get_byte(extensions.gen_random_bytes(1), 0);
    if random_byte < 224 then
      result_code := result_code || substr(alphabet, (random_byte % 32) + 1, 1);
    end if;
  end loop;
  return result_code;
end;
$$;

create or replace function public.wafflr_create_room(
  p_title text,
  p_template text,
  p_mode text,
  p_cards_per_guest smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_credential text := encode(extensions.gen_random_bytes(32), 'hex');
  v_room public.rooms%rowtype;
  v_attempt integer := 0;
begin
  if p_title is null or char_length(trim(p_title)) not between 1 and 80 then
    raise exception 'Room title must be between 1 and 80 characters' using errcode = '22023';
  end if;
  if p_template is null or p_template not in ('restaurant', 'movie', 'activity', 'custom') then
    raise exception 'Invalid decision template' using errcode = '22023';
  end if;
  if p_mode is null or p_mode not in ('host', 'guests') then
    raise exception 'Invalid room mode' using errcode = '22023';
  end if;
  if (p_mode = 'guests' and (p_cards_per_guest is null or p_cards_per_guest not between 1 and 3))
     or (p_mode = 'host' and p_cards_per_guest is not null) then
    raise exception 'Invalid cards-per-guest setting' using errcode = '22023';
  end if;

  loop
    v_code := public.wafflr_generate_room_code();
    begin
      insert into public.rooms(code, title, template, mode, cards_per_guest)
      values (v_code, trim(p_title), p_template, p_mode, p_cards_per_guest)
      returning * into v_room;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 8 then
        raise exception 'Could not allocate room code; retry' using errcode = '40001';
      end if;
    end;
  end loop;

  insert into public.room_participants(room_id, credential_hash, role)
  values (v_room.id, extensions.digest(v_credential, 'sha256'), 'creator');

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id, 'code', v_room.code, 'title', v_room.title,
      'template', v_room.template, 'mode', v_room.mode, 'phase', v_room.phase,
      'guestCount', 1, 'createdAt', v_room.created_at, 'expiresAt', v_room.expires_at
    ),
    'participantCredential', v_credential
  );
end;
$$;

create or replace function public.wafflr_join_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_credential text := encode(extensions.gen_random_bytes(32), 'hex');
  v_guest_count integer;
  v_code text;
  v_headers jsonb;
  v_source text;
  v_source_hash bytea;
  v_attempt_count smallint;
begin
  if p_code is null or upper(trim(p_code)) !~ '^[A-Z0-9]{6}$' then
    raise exception 'Enter a valid six-character room code' using errcode = '22023';
  end if;
  v_code := upper(trim(p_code));

  -- PostgREST/Supabase supplies request headers to the database session.
  -- If the proxy header is unavailable, use a shared fallback bucket rather
  -- than silently disabling throttling.
  begin
    v_headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  exception when others then
    v_headers := '{}'::jsonb;
  end;
  v_source := split_part(coalesce(v_headers ->> 'x-forwarded-for', 'unknown'), ',', 1);
  v_source_hash := extensions.digest(v_source, 'sha256');

  insert into public.room_join_attempts(source_hash, code, window_started_at, attempt_count)
  values (v_source_hash, v_code, now(), 1)
  on conflict (source_hash, code) do update
    set window_started_at = case
          when public.room_join_attempts.window_started_at < now() - interval '5 minutes' then now()
          else public.room_join_attempts.window_started_at
        end,
        attempt_count = case
          when public.room_join_attempts.window_started_at < now() - interval '5 minutes' then 1
          else public.room_join_attempts.attempt_count + 1
        end
  returning attempt_count into v_attempt_count;

  if v_attempt_count > 5 then
    raise exception 'Too many attempts. Wait a few minutes and try again.' using errcode = '42501';
  end if;

  select * into v_room
  from public.rooms
  where code = v_code
    and phase = 'collecting'
    and expires_at > now();

  if not found then
    raise exception 'Room not found or no longer accepting guests' using errcode = 'P0002';
  end if;

  insert into public.room_participants(room_id, credential_hash, role)
  values (v_room.id, extensions.digest(v_credential, 'sha256'), 'guest');

  select count(*)::integer into v_guest_count
  from public.room_participants where room_id = v_room.id;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'id', v_room.id, 'code', v_room.code, 'title', v_room.title,
      'template', v_room.template, 'mode', v_room.mode, 'phase', v_room.phase,
      'guestCount', v_guest_count, 'createdAt', v_room.created_at, 'expiresAt', v_room.expires_at
    ),
    'participantCredential', v_credential
  );
end;
$$;

-- Internal helper must never be callable by client roles.
revoke all on function public.wafflr_generate_room_code() from public, anon, authenticated;
revoke all on function public.wafflr_create_room(text, text, text, smallint) from public, anon, authenticated;
revoke all on function public.wafflr_join_room(text) from public, anon, authenticated;
grant execute on function public.wafflr_create_room(text, text, text, smallint) to anon;
grant execute on function public.wafflr_join_room(text) to anon;
