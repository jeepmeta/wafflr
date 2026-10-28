---
name: react-native-architecture
description: Use when adding or restructuring Expo / React Native features, routes, components, native dependencies, or shared UI packages in Wafflr.
---

# React Native architecture skill

1. Read root and app-level `AGENTS.md`.
2. Inspect the installed Expo SDK and use its versioned documentation before touching Expo APIs or native dependencies.
3. Keep Expo Router route files in `apps/mobile/src/app/`; keep reusable components and feature logic outside the route directory.
4. Use `StyleSheet` with `@wafflr/design-tokens`. Do not introduce Tailwind or NativeWind.
5. Keep shared domain logic in `@wafflr/game-engine` and contracts in `@wafflr/shared-types`.
6. Avoid premature abstractions and unnecessary dependencies. Use Expo-supported packages where practical.
7. Keep platform-specific behavior explicit and test iOS and Android implications.
8. Keep web-only components out of core native flows; do not build a web game.
9. Respect safe areas, touch target sizes, accessibility labels, reduced motion, and offline/reconnect states.
10. Run type checks and Expo Doctor when appropriate; report exactly what was verified.
