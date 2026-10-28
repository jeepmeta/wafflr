# Development workflow

## Prerequisites

- Node.js 24+
- pnpm 11.25.x as pinned in the root package metadata
- Git
- Expo-compatible iOS/Android simulator or physical device when testing native behavior

## Setup

```sh
git clone https://github.com/jeepmeta/wafflr.git
cd wafflr
pnpm install
pnpm check-types
```

Start the mobile development server:

```sh
pnpm --filter @wafflr/mobile start
```

Use the Expo Go app where supported; native modules that are not included in Expo Go require a development build. Check SDK-specific docs before adding dependencies.

## Workspace commands

```sh
pnpm dev
pnpm check-types
pnpm lint
pnpm build
pnpm format
```

Not every workspace necessarily implements every script yet. Treat missing-task output as a scaffold gap to fix, not as a successful check.

## Change workflow

1. Read root `AGENTS.md` and any nested instructions.
2. Read the product/architecture docs relevant to the change.
3. Inspect existing code before designing new abstractions.
4. Make the smallest coherent change.
5. Add or update tests for domain logic and important user-visible rules.
6. Run the relevant package check, then root checks when available.
7. Update docs when behavior or architecture changes.
8. Report verified results and anything not tested.

## Dependency policy

- Prefer current dependencies and Expo-supported modules.
- Use the Expo-aware installer for Expo/native dependencies.
- Avoid adding libraries for trivial functionality.
- Explain the requirement and maintenance cost for any new dependency.
