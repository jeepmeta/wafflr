# Architecture overview

## Platform

- **Mobile app:** Expo + React Native + Expo Router for iOS and Android.
- **Landing page:** lightweight public web page with product explanation and app-store links. It is not a web game.
- **Monorepo:** pnpm workspaces managed by Turborepo.
- **Backend:** existing Supabase project/backend is intended to remain. Do not apply migrations until local files and remote migration history are reconciled.

## Boundaries

```text
apps/mobile ────────┬── @wafflr/shared-types
                    ├── @wafflr/game-engine
                    └── @wafflr/design-tokens

apps/landing ───────┬── content/brand assets (as needed)
                    └── shared types only if genuinely useful

@wafflr/game-engine ── @wafflr/shared-types

Supabase trusted operations ── authoritative database state
Mobile client ── authenticated requests + realtime notifications
```

The dependency graph should remain one-directional. Shared packages must not import from apps. The game engine must not depend on React Native, Expo, Supabase, networking, or device APIs.

## State and trust

- UI state is presentation state; it is not the source of truth for room permissions or results.
- Protected backend operations validate the participant credential, role, room phase, and expiry.
- Realtime broadcasts are hints to refresh authoritative state, not trusted state mutations.
- Round eligibility and result closure must be deterministic and server-authoritative.

## Styling and assets

- Use shared semantic TypeScript tokens consumed by React Native `StyleSheet`.
- Avoid Tailwind/NativeWind and avoid maintaining duplicate token sources.
- Branded controls and character art should primarily be exported raster WebP assets with an inventory; ordinary layout remains native UI.
- Token values remain provisional until the brand system is finalized.

## Current stage

Foundation and contracts first. Do not implement a complete game flow until package boundaries, domain invariants, backend migration history, and asset conventions are documented and checked.
