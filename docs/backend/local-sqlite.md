# Local SQLite backend

## Purpose

Wafflr uses a local SQLite database as its default development backend. This allows room creation and joining to be developed without Supabase credentials, a network connection, or a remote database.

The mobile app uses Expo SQLite. The database file is named `wafflr-local.db` and is created on the device. Schema changes are versioned with SQLite's `PRAGMA user_version` and applied by the local database initializer.

## Current implementation

The first schema version contains:

- `rooms`: room code, title, decision template, deck mode, guest card quota, phase, creation time, and expiration;
- `participants`: creator/guest records and SHA-256 hashes of participant credentials;
- `cards`: contributed decision cards;
- `ballots`: submitted participant ballots and round number;
- `ballot_votes`: Yep/Nah choices for cards in a ballot.

Room codes are six characters and case-insensitive. They identify a room but do not authorize access. Each participant receives a separate random 256-bit credential. The raw credential is stored in Expo SecureStore; SQLite stores only its SHA-256 hash.

Create Room and Join Room now call the local SQLite adapter. No Supabase URL, anon key, RPC, or remote request is required. The existing room history remains a local convenience.

## Local-only behavior and limitations

This is a device-local database, not a shared server. A room created in one app installation cannot be joined from another phone by entering its code. To test multiple participants at this stage, use the same local database or add a development-only participant simulator. Cross-device play requires a shared backend such as Supabase.

SQLite does not reproduce PostgreSQL behavior, Supabase Row Level Security, PostgREST RPCs, or Edge Functions. The local implementation tests application rules and persistence, not remote authorization or deployment security.

The current migration creates the tables needed for the game flow, but card operations, ballot submission, winner calculation, tie-breakers, and expiration cleanup still need to be implemented and tested as service operations. The presence of their tables does not mean those features are complete.

## Development

Install the Expo SDK 58-compatible packages and regenerate the pnpm lockfile:

```sh
pnpm install
```

Then start the app normally. No `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` values are needed for the local backend.

To inspect the database during development, use the Expo SQLite database tools or a local SQLite viewer against the app's sandbox database file.

## Supabase migration path

Keep the Supabase migration as a separate PostgreSQL implementation reference. When the app's domain operations are stable, introduce a backend adapter implementing the same service contract. Translate the schema and constraints to PostgreSQL, then test the Supabase implementation independently, including RLS, RPC permissions, rate limiting, and multi-device behavior.

Do not assume a passing SQLite test proves PostgreSQL or Supabase security.
