# Supabase workspace

This directory is reserved for the reconciled Supabase migration history, configuration, and trusted backend operations.

**Do not run `supabase db push`, reset the project, or deploy functions as part of scaffolding.** First compare local migration files with the configured remote project's migration history and schema. See [the Supabase plan](../docs/backend/supabase-plan.md) and [security model](../docs/security/security-model.md).

Do not commit secrets, service-role keys, or credential values. Environment files containing secrets must remain ignored.
