-- Wafflr room bootstrap smoke tests.
-- Run after applying the migration in a disposable local Supabase database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/room_bootstrap.sql
-- The script rolls back all test data. Run as a database owner/superuser so it
-- can inspect the private participant table and verify stored credential hashes.

begin;

do $$
declare
  created jsonb;
  joined jsonb;
  room_id uuid;
  room_code text;
  raw_credential text;
  stored_hash bytea;
  guest_count integer;
begin
  if not has_function_privilege('anon', 'public.wafflr_create_room(text,text,text,smallint)', 'EXECUTE') then
    raise exception 'anon cannot execute create-room RPC';
  end if;
  if not has_function_privilege('anon', 'public.wafflr_join_room(text)', 'EXECUTE') then
    raise exception 'anon cannot execute join-room RPC';
  end if;
  if has_table_privilege('anon', 'public.rooms', 'SELECT')
     or has_table_privilege('anon', 'public.room_participants', 'SELECT')
     or has_table_privilege('anon', 'public.room_join_attempts', 'SELECT') then
    raise exception 'anon has direct read access to a private room table';
  end if;

  created := public.wafflr_create_room(
    'Bootstrap smoke test',
    'restaurant',
    'guests',
    2::smallint
  );

  if jsonb_typeof(created -> 'room') <> 'object' then
    raise exception 'create-room response is missing room object';
  end if;

  room_id := (created #>> '{room,id}')::uuid;
  room_code := created #>> '{room,code}';
  raw_credential := created ->> 'participantCredential';

  if room_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'room code has invalid format: %', room_code;
  end if;
  if length(raw_credential) <> 64 or raw_credential !~ '^[a-f0-9]{64}$' then
    raise exception 'participant credential is not a 32-byte hex token';
  end if;
  if created #>> '{room,mode}' <> 'guests' then
    raise exception 'room contribution mode was not returned';
  end if;

  select p.credential_hash into stored_hash
  from public.room_participants as p
  where p.room_id = room_id
    and p.role = 'creator';

  if stored_hash is null or stored_hash <> extensions.digest(raw_credential, 'sha256') then
    raise exception 'database did not store the SHA-256 credential hash';
  end if;

  joined := public.wafflr_join_room(lower(room_code));

  if joined #>> '{room,id}' <> room_id::text then
    raise exception 'case-insensitive join returned a different room';
  end if;
  if joined #>> '{room,guestCount}' <> '2' then
    raise exception 'join response has unexpected participant count';
  end if;
  if joined ->> 'participantCredential' = raw_credential then
    raise exception 'creator and guest credentials must be distinct';
  end if;

  select count(*)::integer into guest_count
  from public.room_participants
  where room_participants.room_id = room_id;

  if guest_count <> 2 then
    raise exception 'expected two participant records, found %', guest_count;
  end if;

  begin
    perform public.wafflr_join_room('BAD');
    raise exception 'invalid room code was accepted';
  exception when sqlstate '22023' then
    null;
  end;

  begin
    perform public.wafflr_create_room('Invalid quota', 'restaurant', 'guests', 4::smallint);
    raise exception 'invalid guest quota was accepted';
  exception when sqlstate '22023' then
    null;
  end;
end;
$$;

rollback;
