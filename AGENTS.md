<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": true` in the root `turbo.json` or `turbo.jsonc` to opt in; this does not remove an existing block. Keep it committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Wafflr repository instructions

## Product and platform

- Wafflr is a social decision-making game, not fundamentally a restaurant app.
- The core loop is **Decision → Deck → Vote → Reveal → Winner**.
- The initial template is restaurant selection. Other templates must reuse the same core engine rather than fork the voting system.
- The product is native-first: Expo / React Native for iOS and Android. The web surface is a lightweight landing page only; do not build a browser-based game.
- Butters is the waffle mascot. The visual language is playful, chunky, polished, and game-like. Raster WebP UI assets are preferred for branded artwork; avoid CSS-drawn branded controls and unnecessary SVG-heavy UI.
- Keep the MVP narrow and optimize for the fastest path from indecision to a result.

## Privacy and identity

- No chat, public participant list, names, profiles, nicknames, account creation, or displayed host identity in the MVP.
- Use anonymous device credentials for participant authorization. Store raw credentials only in secure client storage and store only a verifier/hash server-side.
- A six-character room code is an identifier, never a credential. Do not put participant credentials in URLs, QR payloads, analytics, logs, or realtime messages.
- Realtime events are notifications, not authority. Protected operations and final room state must be validated by trusted backend code.
- Never expose Supabase service-role keys or other server secrets to client code.

## Engineering rules

- Keep `packages/game-engine` pure TypeScript: deterministic, framework-independent, and free of network, database, UI, and device APIs.
- Keep domain/API contracts in `packages/shared-types`. Avoid leaking Supabase-generated database types into general UI components.
- Keep design tokens in `packages/design-tokens` and consume them from native `StyleSheet` styles. Do not introduce Tailwind as the styling system.
- Avoid duplicate sources of truth. Document any intentional duplication and how it is synchronized.
- Prefer the platform's Expo modules and existing dependencies. Check the installed SDK docs and package compatibility before adding or upgrading native dependencies.
- Do not invent backend behavior or silently change agreed UX rules. If docs conflict, flag the conflict and follow the latest explicit product-owner decision.
- Do not apply migrations, reset databases, rotate credentials, or alter production services without explicit authorization and migration-history reconciliation.
- Do not add features just because they are technically possible. Label suggestions MVP, post-MVP, or speculative.

## Workflow

1. Inspect the existing implementation and the relevant docs before editing.
2. Make focused, coherent changes; preserve user changes and unrelated starter configuration unless it is deliberately being replaced.
3. Update docs when an architectural or product decision changes.
4. Run the narrowest relevant checks, then root type checks/lint/build where available.
5. Report exactly what changed, what was verified, what was not run, and any remaining blockers.
6. Do not claim a command or test passed unless it was actually run.

## Repository map

- `apps/mobile`: Expo Router app.
- `apps/landing`: lightweight landing page only.
- `packages/shared-types`: domain and cross-boundary types.
- `packages/game-engine`: deterministic game rules and scoring.
- `packages/design-tokens`: shared design tokens.
- `supabase`: backend artifacts, only after migration history is reconciled.
- `docs`: canonical product and engineering documentation.
- `.agents/skills`: reusable task-specific instructions.
