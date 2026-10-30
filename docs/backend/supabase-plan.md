# Supabase backend plan

## Intended responsibilities

Supabase is the persistence and realtime layer. The backend—not the mobile client—owns authorization, validation, state transitions, and decision results.

The first room-bootstrap migration now exists at `supabase/migrations/20261030210000_room_bootstrap.sql`. It is a repository draft only. It has not been applied to a Supabase project or validated against a live database.

## Current schema foundation

The draft defines:

- `rooms`: room code, title, template, contribution mode, phase, creation time, and expiration;
- `room_participants`: anonymous participant credential hashes and creator/guest role;
- `room_join_attempts`: a provisional per-source/per-code join throttle;
- narrowly scoped create-room and join-room database functions.

The room code is a lookup identifier, not authorization. Each device receives a separate high-entropy participant credential; only its hash is stored in the database. The raw credential must be saved in platform secure storage on the device.

The SQL-side join throttle depends on request-header information supplied through the Supabase/PostgREST request context. Its behavior and resistance to header spoofing must be verified on the actual deployment path. Do not treat it as production-grade rate limiting until that is tested. Creation abuse also needs protection.

## Current mobile integration

The Expo mobile app calls the create-room and join-room PostgREST RPCs using the public Supabase URL and anon key. The RPC response includes a one-time raw participant credential; the client immediately saves it with Expo SecureStore and stores only non-secret room summaries in secure local history. The web target intentionally blocks live room operations because this credential flow currently requires native secure storage.

The Create Room and Join Room setup screens call the live RPC client and display the returned room code after success. Your Rooms reads the locally saved room summaries. These changes are wired in the repository but have not been verified against a live Supabase project or on physical devices. The migration remains unapplied.

Mobile environment variables are documented in `apps/mobile/.env.example`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Only the public anon key belongs in the mobile app. Never add a service-role key to an Expo environment variable or client bundle.

## Next implementation milestone

Make real room creation and joining work from two separate devices:

1. Install dependencies from the committed lockfile and run the mobile type check.
2. Review and test the migration in a disposable local Supabase environment.
3. Verify request-header behavior and rate limiting; move public entrypoints behind an Edge Function if trustworthy client identity is not available to the database.
4. Configure a non-production Supabase project and its mobile environment variables.
5. Verify creator and guest devices can create/join the same collecting room and that credentials survive app restarts.
6. Add a safe room lookup/re-entry flow that uses the saved participant credential rather than treating the room code as authorization.

Do not apply migrations to the owner's remote project as part of repository scaffolding. Confirm the target project and reconcile its migration history before any remote database change.

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
