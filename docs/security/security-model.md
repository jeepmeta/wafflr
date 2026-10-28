# Security model

This document describes intended controls. It does not assert that the current backend has implemented or passed an audit of them.

## Anonymous participation

- No account creation, public profiles, nicknames, or participant names in the MVP.
- Each installation/device receives a high-entropy anonymous participant credential.
- Store the raw credential in platform secure storage (for example, Expo SecureStore); do not put it in AsyncStorage, URLs, QR codes, analytics, or logs.
- Store only a verifier/hash server-side. Use a cryptographically appropriate one-way construction and compare safely.
- Do not offer account recovery or cross-device identity linking in the initial product unless the owner changes this decision.

## Room code versus credential

- The six-character alphanumeric room code is a discoverability/lookup identifier, not a secret and not authorization.
- Every protected operation must separately prove participant authority.
- Normalize room codes consistently and apply rate limits to code guessing and join attempts.
- QR codes must contain only the room code or a non-sensitive join payload; never include the participant credential.

## Server authority

- The backend validates participant credential, room membership/role, current phase, and expiration for every protected operation.
- Backend code owns state transitions, eligibility snapshots, ballot acceptance, score calculation, tie detection, and finalization.
- Realtime payloads trigger refreshes; clients must not treat them as authoritative commands or final results.
- Never ship the Supabase service-role key to mobile or landing clients. Client configuration may contain only public project URL and public anon/publishable key with appropriate RLS.

## Privacy and retention

- Do not expose host identity or participant names.
- Show aggregate guest count only where needed.
- Define and test room expiration, completed-room retention, and deletion of detailed data before launch. Earlier proposed windows (such as two-hour inactivity or 24-hour retention) are not yet confirmed product decisions.
- Retain only aggregate metrics that have been explicitly approved and that cannot identify participants.

## Backend migration safety

Before any migration or deployment:
1. Inspect the local migration files and current Supabase project migration history.
2. Compare schemas and migration versions.
3. Confirm the target project explicitly.
4. Back up or export relevant schema/data if appropriate.
5. Apply only the reconciled migration plan with owner authorization.
