# Mobile app instructions

This workspace is the native Wafflr application for iOS and Android, built with Expo, React Native, and Expo Router.

## Before changing Expo or native dependencies

1. Read the installed Expo SDK version from `package.json`.
2. Consult the matching versioned documentation at https://docs.expo.dev/versions/ and the current API's specific documentation.
3. Use `pnpm exec expo install <package>` (or the matching package-manager invocation) to select Expo-compatible native package versions.
4. Run Expo Doctor after changing native dependencies or app configuration.

Do not assume an API from a different Expo SDK is still valid.

## Architecture

- Route files belong in `src/app/`; reusable components, hooks, services, and feature modules belong outside the route directory.
- Use Expo Router for navigation.
- Use React Native `StyleSheet` and `@wafflr/design-tokens` for styling. Do not introduce Tailwind/NativeWind as the app's styling foundation.
- Keep screens thin. Put domain rules in `@wafflr/game-engine`, cross-boundary contracts in `@wafflr/shared-types`, and backend access behind feature/service boundaries.
- Prefer branded WebP assets for game UI and Butters artwork. Keep source artwork and generated/exported assets organized and inventoried.
- Respect reduced-motion preferences and keep animation purposeful and brief.
- Do not build a web game. Any web-compatible files should support development/preview or the separate landing experience, not a browser-based game product.

## Security and state

- Store anonymous participant credentials using secure device storage, never ordinary preferences or URL parameters.
- Room codes do not authorize protected operations.
- Never trust client-calculated winner state or realtime payloads. Treat the backend as authoritative.
- Never place service-role keys or private server secrets in Expo config or client environment variables.

## Verification

- Run `pnpm check-types` and relevant tests before declaring a change complete.
- Run `pnpm exec expo-doctor` after native dependency/config changes.
- Check iOS and Android implications for platform-specific code.
- Use `pnpm --filter @wafflr/mobile start` to start the Expo development server.
