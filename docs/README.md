# Documentation index

This is the canonical index for Wafflr's product and engineering documentation. Keep docs concise, actionable, and aligned with the current implementation. Mark uncertain decisions as hypotheses instead of presenting them as settled facts.

## Product

- [Product brief](product/product-brief.md) — purpose, positioning, MVP scope, and validation assumptions.
- [Core journeys](product/core-journeys.md) — host, guest, and round flows.
- [Brand direction](brand/brand-direction.md) — visual and interaction principles.

## Architecture and engineering

- [Architecture overview](architecture/overview.md) — system boundaries and data flow.
- [Package responsibilities](architecture/packages.md) — workspace ownership and dependency rules.
- [Development workflow](engineering/development.md) — local setup and verification.
- [Testing strategy](testing/strategy.md) — test boundaries and minimum expectations.
- [Asset pipeline](assets/asset-pipeline.md) — source files, exports, naming, and inventory.

## Security and backend

- [Security model](security/security-model.md) — anonymous credentials, room codes, and trust boundaries.
- [Supabase plan](backend/supabase-plan.md) — backend responsibilities and safe migration process.

## Decisions

- [Decision log](decisions/README.md) — durable architectural/product decisions and unresolved questions.

## Agent instructions

- Root [AGENTS.md](../AGENTS.md) defines repository-wide constraints.
- [Wafflr product skill](../.agents/skills/wafflr-product/SKILL.md) provides product/UX review guidance.
- [React Native architecture skill](../.agents/skills/react-native-architecture/SKILL.md) guides native feature structure.
- [Supabase security skill](../.agents/skills/supabase-security/SKILL.md) covers backend and credential safety.
