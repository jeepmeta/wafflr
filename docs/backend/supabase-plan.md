# Supabase backend plan

## Current development backend

The mobile app now defaults to a device-local SQLite backend implemented with Expo SQLite. See `docs/backend/local-sqlite.md` for the schema, limitations, and development workflow. Room creation and joining no longer require Supabase configuration or network access.

The SQL migration below remains a draft reference for the future PostgreSQL/Supabase adapter. It has not been applied to a Supabase project.

## Intended Supabase responsibilities

Supabase is the persistence and realtime layer. The backend—not the mobile client—owns authorization, validation, state transitions, and decision results.

The room-bootstrap migration at `supabase/migrations/20261030210000_room_bootstrap.sql` is a future PostgreSQL implementation draft only. It has not been applied to a Supabase project or validated against a live database.

## Current schema foundation

The draft defines:

- `rooms`: room code, title, template, contribution mode, phase, creation time, and expiration;
- `room_participants`: anonymous participant credential hashes and creator/guest role;
- `room_join_attempts`: a provisional per-source/per-code join throttle;
- narrowly scoped create-room and join-room database functions.

The room code is a lookup identifier, not authorization. Each device receives a separate high-entropy participant credential; only its hash is stored in the database. The raw credential must be saved in platform secure storage on the device.

The SQL-side join throttle depends on request-header information supplied through the Supabase/PostgREST request context. Its behavior and resistance to header spoofing must be verified on the actual deployment path. Do not treat it as production-grade rate limiting until that is tested. Creation abuse also needs protection.

## Previous Supabase client wiring

The earlier direct PostgREST room client has been replaced by the local SQLite adapter in `apps/mobile/src/lib/local-database.ts`. The app no longer requires `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` to create or join rooms. The Supabase migration remains a future backend reference and is not active in the app.

The local adapter uses Expo SQLite for room and participant records, Expo Crypto for random identifiers and credential hashing, and Expo SecureStore for each device's raw participant credential. The local room history remains a convenience layer.

## Database smoke test

A rollback-only SQL smoke test is available at `supabase/tests/room_bootstrap.sql`. It checks anon RPC grants, direct table-read restrictions, room-code shape, credential hashing, case-insensitive joining, participant counts, and invalid input rejection. Run it only against a disposable local Supabase database after applying the migration. It has been added to the repository but has not been executed in this environment.

## Next implementation milestone

Finish and exercise the local-first game flow before adding a remote backend:

1. Regenerate the pnpm lockfile after installing the Expo SDK 58-compatible SQLite and Crypto packages.
2. Run the Expo TypeScript check and fix any dependency or platform issues.
3. Build the card-entry and host-review screens on top of the repository contract.
4. Add ballot submission, vote completion, scoring, winner reveal, and tie-breaker operations.
5. Add local persistence/re-entry tests and verify that credentials survive app restarts.
6. Add a development participant simulator if we need to test multiple people on one local database.

Only after the domain operations and game flow are stable should we add a Supabase adapter. At that point, test PostgreSQL migrations and authorization in a disposable local Supabase stack, then configure a non-production hosted project for two-device testing.

No remote Supabase project has been configured or changed as part of the local-first work.

## Later backend operations

After create/join works, add cards, contribution quotas, voting rounds, ballots, tie-breakers, and finalization. Trusted operations must enforce:

- card creation/edit/removal only during collection and within the room's configured mode;
- the one-to-three-card guest quota and the one-hundred-card room cap;
- the minimum of two cards before voting;
- eligible-participant snapshots and ballot submission rules;
- vote scoring, tie detection, tie-breaker rounds, and creator tie resolution;
- expiration and deletion of detailed room data.

Realtime should notify clients that state may have changed; clients then fetch authoritative state.

## Migration guardrail

**Do not push migrations, reset the project, or deploy functions without explicit owner authorization.**

Before a remote migration:
1. Confirm the exact target Supabase project.
2. Retrieve its migration history and inspect its current schema.
3. Reconcile local migration versions and schema differences.
4. Back up relevant data/schema where appropriate.
5. Apply only the reviewed migration plan with owner authorization.

## Open decisions

- Whether public room operations should be exposed through Edge Functions rather than direct anonymous RPC calls.
- Reliable rate limiting for both room creation and joining.
- Room inactivity and maximum lifetime.
- Detailed-data retention and deletion guarantees.
- Ballot completion rule and treatment of unvoted cards.
