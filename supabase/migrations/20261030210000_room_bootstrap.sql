-- Wafflr room bootstrap: rooms and anonymous participants.
-- Draft migration: review against the target Supabase project before applying.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(title) between 1 and 80),
  template text not null check (template in ('restaurant', 'movie', 'activity', 'custom')),
  mode text not null check (mode in ('host', 'guests')),
  cards_per_guest smallint check (cards_per_guest between 1 and 3),
  phase text not null default 'collecting' check (phase in ('collecting', 'voting', 'round_reveal', 'completed', 'cancelled', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint guest_mode_quota check ((mode = 'guests' and cards_per_guest is not null) or (mode = 'host' and cards_per_guest is null))
);

create table if not exists public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  credential_hash bytea not null,
  role text not null check (role in ('creator', 'guest')),
  joined_at timestamptz not null default now(),
  unique (room_id, credential_hash)
);

create index if not exists room_participants_room_id_idx on public.room_participants(room_id);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);

alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;

-- Clients must use the narrowly scoped RPCs. No direct table access is granted here.
revoke all on public.rooms from anon, authenticated;
revoke all on public.room_participants from anon, authenticated;

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
  if p_template not in ('restaurant', 'movie', 'activity', 'custom') then
    raise exception 'Invalid decision template' using errcode = '22023';
  end if;
  if p_mode not in ('host', 'guests') then
    raise exception 'Invalid room mode' using errcode = '22023';
  end if;
  if (p_mode = 'guests' and p_cards_per_guest not between 1 and 3)
     or (p_mode = 'host' and p_cards_per_guest is not null) then
    raise exception 'Invalid cards-per-guest setting' using errcode = '22023';
  end if;

  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 6));
    begin
      insert into public.rooms(code, title, template, mode, cards_per_guest)
      values (v_code, trim(p_title), p_template, p_mode, p_cards_per_guest)
      returning * into v_room;
      exit;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt >= 5 then raise exception 'Could not allocate room code; retry' using errcode = '40001'; end if;
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
begin
  if p_code is null or upper(trim(p_code)) !~ '^[A-Z0-9]{6}$' then
    raise exception 'Enter a valid six-character room code' using errcode = '22023';
  end if;

  select * into v_room
  from public.rooms
  where code = upper(trim(p_code))
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

revoke all on function public.wafflr_create_room(text, text, text, smallint) from public, authenticated;
revoke all on function public.wafflr_join_room(text) from public, authenticated;
grant execute on function public.wafflr_create_room(text, text, text, smallint) to anon;
grant execute on function public.wafflr_join_room(text) to anon;
