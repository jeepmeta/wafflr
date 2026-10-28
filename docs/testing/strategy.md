# Testing strategy

## Game engine (highest priority)

Keep logic deterministic and test without Expo or Supabase. Cover:

- zero cards and empty ballots;
- all-zero scores and ties;
- unique leader and multiple tied leaders;
- Nah and missing votes do not subtract;
- duplicate vote records cannot inflate a participant's Yep count;
- votes for unknown card IDs are ignored or rejected according to the documented contract;
- tie-breaker deck contains only tied leaders;
- stable behavior when card order changes, where ordering is part of the contract.

The current package has scoring functions but does not yet have a test runner or committed test suite. Choose a lightweight runner when the first tests are added and justify any dependency.

## Shared contracts

Type-check shared types and package consumers. Add runtime validation at untrusted input boundaries; TypeScript types do not validate network payloads.

## Mobile

Test key journeys on iOS and Android, including room creation/join, contribution limits, editing lock at voting start, private ballots, round reveal, tie-breakers, expired rooms, offline/reconnect states, and secure credential persistence.

## Backend

Test authorization failures, phase conflicts, duplicate requests, race conditions, eligibility snapshots, idempotent ballot submission/round closure, rate limits, and retention jobs. RLS alone must not be treated as a substitute for server-side business validation.

## Completion rule

Do not claim a task is complete merely because TypeScript passes. Report which tests ran, which platforms were exercised, and what remains unverified.
