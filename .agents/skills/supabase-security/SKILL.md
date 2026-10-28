---
name: supabase-security
description: Use when designing or modifying Wafflr Supabase schema, RLS, Edge Functions, database functions, realtime, migrations, or anonymous participant credentials.
---

# Supabase security skill

This skill is a safety checklist, not a claim that the current backend already satisfies it.

## Before changing backend state

- Inspect local migrations and remote migration history first.
- Identify the target project and reconcile drift before applying anything.
- Never reset, push, or deploy without explicit owner authorization.
- Never commit credentials or print secrets in logs or summaries.

## Threat model

- A room code identifies a room; it does not authorize access.
- Each protected request validates a high-entropy anonymous participant credential and the participant's role, room phase, and expiry.
- Store raw credentials only in secure client storage. Persist only a verifier/hash server-side.
- Realtime broadcasts are not trusted commands or authoritative room state.
- The server owns round eligibility, ballot acceptance, score calculation, tie detection, and finalization.
- Never expose the Supabase service-role key in client bundles or public environment variables.

## Review every mutation

Check authorization, input validation, phase transition, idempotency, rate limits, race conditions, RLS interaction, and auditability. Test unauthorized, stale-phase, duplicate, and concurrent requests.
