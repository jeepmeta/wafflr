# Wafflr

**Stop waffling. Start deciding.**

Wafflr is a playful group decision game that helps people move from indecision to a clear result. The first use case is choosing where to eat; the underlying decision → deck → vote → reveal → winner loop is designed to support other group decisions over time.

## Product direction

- **Native-first:** Expo + React Native for iOS and Android.
- **No web game:** the web surface is a lightweight landing page that points people to the app stores and explains the product.
- **Low friction:** guests should be able to participate without accounts or profiles.
- **Privacy by default:** no chat, public participant names, profiles, or host identity display.
- **One excellent core loop:** do not expand the MVP just because a feature is possible.
- **Backend-authoritative outcomes:** clients present state and submit intent; trusted server operations validate permissions, phase transitions, and final scores.

## Repository map

| Path | Responsibility |
| --- | --- |
| `apps/mobile` | Expo / React Native iOS and Android app |
| `apps/landing` | Lightweight public marketing and app-store landing page |
| `packages/shared-types` | Shared domain and API contract types |
| `packages/game-engine` | Pure deterministic decision and scoring logic |
| `packages/design-tokens` | Shared semantic design tokens for native UI |
| `packages/typescript-config` | Shared TypeScript configuration |
| `packages/eslint-config` | Shared lint configuration |
| `assets` | Brand source files, exported artwork, and asset inventory |
| `supabase` | Database migrations, functions, and backend configuration (when reconciled) |
| `docs` | Product, architecture, engineering, security, UX, and release documentation |
| `.agents/skills` | Focused instructions for recurring engineering and product tasks |

See [docs/README.md](docs/README.md) for the documentation index and [AGENTS.md](AGENTS.md) for repository-wide working rules.

## Prerequisites

- Node.js 24 or newer
- pnpm 11 (the repository pins its package manager version)

## Common commands

```sh
pnpm install
pnpm dev
pnpm check-types
pnpm lint
pnpm build
```

Run the mobile app directly with `pnpm --filter @wafflr/mobile start`. Use Expo's compatible dependency installer for Expo-native dependencies; consult the installed SDK's versioned documentation before changing native APIs or packages.

The landing app is being scaffolded separately. Until its package manifest and scripts are in place, root Turbo commands may only run tasks implemented by the current workspaces.

## Development principles

1. Read the relevant product and architecture docs before implementing a flow.
2. Keep the game engine framework-agnostic and deterministic.
3. Keep presentation, backend orchestration, and domain logic separate.
4. Never ship Supabase service-role credentials to a client.
5. Treat room codes as identifiers, not authorization credentials.
6. Add dependencies only when a concrete requirement justifies them.
7. Run type checks and relevant tests before considering a change complete.

## Status

This repository is in the foundation stage. Package boundaries and domain rules are being documented before feature implementation. Design tokens are provisional, and backend migrations must not be applied until the existing migration history and target Supabase project have been reconciled.
