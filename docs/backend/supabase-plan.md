# Supabase backend plan

## Intended responsibilities

Supabase is the persistence and realtime layer, not the product's decision authority by virtue of the client SDK. Trusted server-side operations must enforce rules and calculate results.

Likely domain records include rooms, participants, cards, rounds, and ballots. Exact schema and function names must be based on the existing project's migrations and current remote state—not invented from this planning document.

## Client versus trusted operations

The mobile client may read permitted room state and request actions using its anonymous participant credential. Trusted operations should own protected writes and transitions such as:

- creating a room and participant credential;
- joining by room code with rate limiting;
- adding/editing/removing cards during collection;
- starting a round and snapshotting eligible participants;
- submitting and locking ballots;
- closing a round and calculating results;
- creating tie-breaker rounds and finalizing a winner;
- expiring rooms and deleting detailed data according to approved retention rules.

Realtime should notify clients that state may have changed; clients then fetch authoritative state.

## Migration guardrail

**Do not push migrations, reset the project, or change remote database state during repository scaffolding.**

The owner has an existing Supabase project and prior migration history. Before backend work, inspect the current repository migrations, identify the configured project ref without exposing secrets, retrieve the remote migration history, and reconcile differences. Do not assume a blank database or create a parallel schema.

## Pending design decisions

- Exact database schema and RLS policies.
- Whether privileged actions use Edge Functions, database functions, or a combination.
- Join-attempt throttling and room-code collision strategy.
- Room inactivity and maximum lifetime.
- Detailed-data retention and deletion guarantees.
- Ballot completion rule: explicit vote on every card versus unvoted cards counting as zero.
