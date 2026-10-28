# Package responsibilities

## Applications

### `apps/mobile` — `@wafflr/mobile`

Owns Expo configuration, routes, native presentation, platform integration, secure local credential storage, and user interaction. Keep route components thin and organize reusable code by feature.

Suggested eventual structure (create only when the relevant feature is ready):

```text
src/
  app/                 # Expo Router routes/layouts only
  components/          # shared presentational components
  features/
    home/
    room-create/
    room-join/
    deck-builder/
    voting/
    results/
    rooms-history/
  services/             # API/realtime adapters
  hooks/
  constants/
  utils/
```

### `apps/landing`

A small responsive marketing surface with app-store links, product value proposition, privacy/support links, and optional waitlist only if explicitly approved. No room creation, deck builder, voting, or browser game.

## Shared packages

### `@wafflr/shared-types`

Owns domain contracts shared across package boundaries: template IDs, room phase, card, ballot, participant-safe room summary, API request/response types. Keep types serializable and avoid exposing database implementation details to UI.

### `@wafflr/game-engine`

Owns pure deterministic rules: approval scoring, leading-card selection, tie detection, tie-breaker input construction, and invariant validation where appropriate. Add tests for edge cases before expanding behavior. No I/O or framework dependencies.

### `@wafflr/design-tokens`

Owns semantic colors, spacing, radii, typography, and motion-duration tokens as typed constants. Values are provisional. Avoid platform-specific styling objects here unless they are deliberately part of a stable cross-platform contract.

### Existing tooling packages

- `@repo/typescript-config`: shared TS compiler configurations.
- `@repo/eslint-config`: shared lint configurations.

Rename existing `@repo/*` tooling packages only if a concrete reason emerges; avoid churn for naming alone.

## Dependency rules

- Apps may depend on shared packages.
- `game-engine` may depend on `shared-types`, but not on apps or design tokens.
- `design-tokens` must remain independent.
- Shared types must remain independent of UI and backend SDKs.
- Avoid circular dependencies.
