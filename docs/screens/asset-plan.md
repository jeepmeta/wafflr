# Screen-to-asset plan

This is a **candidate inventory**, not a request to generate every item. The purpose is to map existing assets to actual UI needs and identify redundant art before creating anything new. The product owner should supply the current asset files or inventory so each candidate can be mapped to an existing file.

## Reuse rules

- Prefer one reusable asset with controlled scale over near-duplicate images.
- Keep dynamic text out of artwork; render labels and counts as native text.
- Use white-background artwork only where required by the current asset-generation workflow. Confirm how white-background assets will sit on non-white surfaces before exporting.
- Separate base sprite artwork from animation timing/placement. Do not create a new character image for every screen if the same sprite can be reused.
- Do not create pressed/disabled/loading variants unless the visual treatment materially changes or the asset itself contains the state.

## Candidate shared assets

| Candidate ID | Candidate file name | Used by | Initial recommendation |
| --- | --- | --- | --- |
| BRAND-01 | `brand/wafflr-wordmark.webp` | Home and shared header | Reuse one wordmark asset; verify if current wordmark is already suitable |
| BUT-01 | `characters/butters/butters-neutral.webp` | Home, waiting, transition | One neutral pose; avoid duplicating for each screen |
| BUT-02 | `characters/butters/butters-encouraging.webp` | Card contribution and voting | Reuse across encouraging moments |
| BUT-03 | `characters/butters/butters-celebrate.webp` | Vote submitted and winner | Reuse for celebration; consider scale/position variants in layout |
| BUT-04 | `characters/butters/butters-tie.webp` | Tie-breaker and repeated tie | Dedicated tie reaction only if the neutral sprite cannot communicate it |
| UI-01 | `ui/buttons/button-primary.webp` | Primary actions across screens | One reusable base button if text remains native |
| UI-02 | `ui/buttons/button-secondary.webp` | Secondary actions | Reuse widely |
| UI-03 | `ui/buttons/button-round-back.webp` | Back navigation | Shared icon button |
| UI-04 | `ui/buttons/button-round-close.webp` | Modals | Shared close button |
| UI-05 | `ui/buttons/button-round-edit.webp` | Card review/editor | Shared edit control |
| UI-06 | `ui/buttons/button-round-remove.webp` | Card review/editor | Shared remove control |
| UI-07 | `ui/buttons/button-yep.webp` | Voting | Reusable Yep control |
| UI-08 | `ui/buttons/button-nah.webp` | Voting | Reusable Nah control |
| UI-09 | `ui/panels/panel-card.webp` | Choice cards and modals | Reuse one card/panel frame where possible |
| UI-10 | `ui/pills/pill-counter.webp` | Guest count, card count, room counts | Render counter text separately |
| UI-11 | `ui/badges/badge-winner.webp` | Result state | One winner badge |
| UI-12 | `ui/badges/badge-tie.webp` | Tie state | One tie badge |
| UI-13 | `ui/icons/icon-qr.webp` | Join and scan flow | Use only if not already available as a platform icon |
| UI-14 | `ui/icons/icon-camera.webp` | QR scan flow | Avoid custom icon if system icon is sufficient |
| UI-15 | `ui/feedback/progress-track.webp` | Submission/waiting | Could be native layout; asset optional |
| UI-16 | `ui/feedback/progress-fill.webp` | Submission/waiting | Could be native layout; asset optional |
| UI-17 | `ui/backgrounds/background-game.webp` | Shared backgrounds | Only if a background materially improves the interface |
| UI-18 | `ui/cards/card-placeholder.webp` | Card entry when no image exists | Could be native frame; asset optional |
| APP-01 | platform app icon files | App icon / store listing | Platform-specific export, not in-screen UI |
| APP-02 | platform splash artwork | Launch/splash | Keep distinct from the home-screen hero |

## Likely not needed unless mockup review proves otherwise

- Separate primary buttons for every screen.
- A unique panel asset for every modal.
- A unique Butters illustration for every state.
- Separate card frames for every decision template.
- Decorative progress bars that can be rendered cleanly with native layout.
- Baked-in text, counters, room codes, or choice names.
- Additional icons for actions already communicated clearly by text.

## Mapping worksheet

For each existing asset, record: current filename, dimensions, format, background, visible padding, state/variant, screen IDs that use it, whether it can be reused, and whether it should be retired. Final asset count is intentionally **not locked** until the current asset collection has been audited against the screen catalog.
