# Screen design workspace

This folder is the UI-first planning workspace for Wafflr. We will finalize screen layouts, transitions, Butters/sprite placement, and the asset inventory here **before** implementing game logic or reconnecting the backend.

## Review order

1. [Screen catalog](screen-catalog.md) — all distinct screens and states.
2. [SVG mockups](mockups/) — editable low-fidelity layouts with sprite-placement notes.
3. [Screen-to-asset plan](asset-plan.md) — candidate assets, reuse strategy, and items that may be unnecessary.
4. [Review checklist](review-checklist.md) — the decisions needed to approve the screen system.

## Scope boundary

These are design artifacts, not production routes or a browser-based game. The mobile product remains Expo / React Native. SVGs are used here because they are easy to preview and edit during review; production UI should use approved assets, native layout, and shared design tokens.

## Mockup status

All mockups are first-pass structural drafts, not final visual designs. They intentionally show major hierarchy, controls, and sprite slots rather than pretending that existing artwork has already been mapped. Do not build production screens from them until the owner has reviewed them.
