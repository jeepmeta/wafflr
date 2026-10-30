# Local SQLite backend

## Purpose

Wafflr uses a local SQLite database as its default development backend. This allows room creation and joining to be developed without Supabase credentials, a network connection, or a remote database.

The mobile app uses Expo SQLite. The database file is named `wafflr-local.db` and is created on the device. Schema changes are versioned with SQLite's `PRAGMA user_version` and applied by the local database initializer.

## Current implementation

The current schema version contains:

- `rooms`: room code, title, decision template, deck mode, guest card quota, phase, creation time, and expiration;
- `participants`: creator/guest records and SHA-256 hashes of participant credentials;
- `cards`: contributed decision cards;
- `ballots`: submitted participant ballots and round number;
- `ballot_votes`: Yep/Nah choices for cards in a ballot;
- `round_cards`: cards included in each voting round;
- `room_join_attempts`: local per-room-code attempt windows for exercising the join-throttle behavior.

Room codes are six characters and case-insensitive. They identify a room but do not authorize access. Each participant receives a separate random 256-bit credential. The raw credential is stored in Expo SecureStore; SQLite stores only its SHA-256 hash.

The UI calls the backend-independent contract in `apps/mobile/src/lib/room-repository.ts`. The active implementation is `local-room-repository.ts`, backed by `local-database.ts`. Create Room and Join Room therefore use local SQLite by default. No Supabase URL, anon key, RPC, or remote request is required. The existing room history remains a local convenience.

## Local-only behavior and limitations

This is a device-local database, not a shared server. A room created in one app installation cannot be joined from another phone by entering its code. The current local adapter keeps one active participant credential per room per installation, so it prevents a second local join from overwriting the creator's credential. A room's six-character code is only useful within the same local database. Cross-device and true group testing require a development participant simulator or, later, a shared backend such as Supabase.

SQLite does not reproduce PostgreSQL behavior, Supabase Row Level Security, PostgREST RPCs, or Edge Functions. The local implementation tests application rules and persistence, not remote authorization or deployment security.

The local service supports room creation and joining on the same device, card listing and contribution, card editing/removal, the creator's transition into voting, private Yep/Nah ballot submission, approval scoring, automatic tie-break rounds, and creator selection after a repeated tie. It enforces collection phase, the one-hundred-card cap, host-versus-guest contribution mode, guest card quota, ownership for guest edits/removals, and the two-card minimum before voting. The mobile room screen is wired to these operations. Expiration cleanup, a multi-participant simulator, and robust recovery from partial local writes remain unfinished.

## Development

Install the Expo SDK 58-compatible packages and regenerate the pnpm lockfile (the package manifest has been updated; the lockfile still needs this install step):

```sh
pnpm install
```

Then start the app normally. No `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` values are needed for the local backend.

To inspect the database during development, use the Expo SQLite database tools or a local SQLite viewer against the app's sandbox database file.

## Supabase migration path

Keep the Supabase migration as a separate PostgreSQL implementation reference. When the app's domain operations are stable, introduce a backend adapter implementing the same service contract. Translate the schema and constraints to PostgreSQL, then test the Supabase implementation independently, including RLS, RPC permissions, rate limiting, and multi-device behavior.

Do not assume a passing SQLite test proves PostgreSQL or Supabase security.
