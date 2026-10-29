# Screen-to-asset plan

This is a **provisional target manifest**, not an instruction to generate every item. First audit the existing art library, map each file to a row below, then mark it **keep**, **adapt**, **replace**, or **retire**. The repository currently does not contain the full existing asset library, so final duplicate detection is not yet possible.

## Asset rules

- One shared asset should serve every screen where possible. Do not create a new button, panel, background, or character image for each screen.
- Dynamic text (room titles, codes, card names, counts, labels, vote totals) stays native text.
- Do not create separate art for every screen state if a reusable character or UI component can be repositioned.
- Avoid separate image assets for progress bars, modal surfaces, generic pills, and standard icons unless the current art style truly requires them.
- Use white-background exports only where required by the existing generation workflow; verify how those exports integrate with the actual app backgrounds before final export.
- Asset filenames below are target names only. Existing files should be mapped to them rather than renamed blindly.

## Core visual roles to preserve or source

| ID | Target filename | Used by | Status before audit | Reuse guidance |
| --- | --- | --- | --- | --- |
| BRAND-01 | `brand/wafflr-wordmark.webp` | Home, persistent header, landing | Audit existing | One wordmark; no per-screen copies |
| BUT-01 | `characters/butters/butters-neutral.webp` | Home, room transition, general waiting | Audit existing | Reuse neutral pose at different sizes |
| BUT-02 | `characters/butters/butters-encouraging.webp` | Contribution and vote-submitted waiting | Audit existing | Optional if neutral pose communicates well |
| BUT-03 | `characters/butters/butters-celebrate.webp` | Winner reveal | Audit existing | One strong celebration pose |
| EGG-01 | `characters/eggin/eggin-tiebreak.webp` | Tie announcement and tie-breaker wait | Audit existing | One special pose; separate dance frames are not MVP-critical |
| UI-01 | `ui/buttons/button-primary.webp` | Primary actions throughout | Audit existing | No baked-in text |
| UI-02 | `ui/buttons/button-secondary.webp` | Secondary actions throughout | Audit existing | No baked-in text |
| UI-03 | `ui/buttons/button-round-back.webp` | Back navigation | Audit existing | Reuse the same control |
| UI-04 | `ui/buttons/button-round-close.webp` | Shared modals | Audit existing | Reuse the same control |
| UI-05 | `ui/buttons/button-round-edit.webp` | Deck review and editor | Audit existing | Reuse the same control |
| UI-06 | `ui/buttons/button-round-remove.webp` | Deck review | Audit existing | Reuse the same control |
| UI-07 | `ui/buttons/button-yep.webp` | Voting | Audit existing | Reuse in normal and tie-break rounds |
| UI-08 | `ui/buttons/button-nah.webp` | Voting | Audit existing | Reuse in normal and tie-break rounds |
| UI-09 | `ui/cards/decision-card-frame.webp` | Voting and result card | Audit existing | One frame across templates |
| UI-10 | `ui/cards/decision-card-back.webp` | Stacked voting deck | Optional | Generate only if visible card stacking needs a branded back |
| TMP-01 | `templates/template-eat.webp` | Template selection | Audit existing | One illustration/icon |
| TMP-02 | `templates/template-watch.webp` | Template selection | Audit existing | One illustration/icon |
| TMP-03 | `templates/template-do.webp` | Template selection | Audit existing | One illustration/icon |
| TMP-04 | `templates/template-custom.webp` | Template selection | Audit existing | One illustration/icon |
| APP-01 | Expo app icon source | Launcher and store | Audit existing | Platform exports may be generated from one approved source |
| APP-02 | Expo splash artwork | Native launch screen | Audit existing | Keep distinct from the home hero only if required by platform presentation |

## Not in the first-pass generation list

Do **not** generate separate files for every screen background, modal frame, panel, pill, progress track/fill, generic QR/camera icon, winner/tie badge, or every Butters emotion yet. These can be native components or existing assets unless mockup review demonstrates a specific branded-art need.

Do not create individual primary/secondary buttons for every label. Button labels remain text over a reusable asset or component. Pressed/disabled states should be native state treatments unless a visual change requires a dedicated sprite.

## Screen-to-asset map

| Screen IDs | Expected reusable artwork |
| --- | --- |
| Home, room transition | Wordmark + Butters neutral |
| Template selection | Four template illustrations/icons |
| Room title, deck mode, join code, QR scan | Wordmark; existing generic controls; no unique background art |
| Host deck builder, guest card entry, host review | Wordmark + reusable edit/remove/button assets |
| Guest waiting, vote submitted | Butters neutral or encouraging |
| Voting, tie-breaker | Decision card frame + Yep/Nah controls; Eggin only for tie-break transition/wait |
| Round reveal, winner | Butters celebrate + decision card frame |
| Your Rooms, room unavailable | Wordmark + generic controls; no unique character asset required by default |
| Shared modals | Reuse primary/secondary/close/edit controls; no unique modal art |

## Audit worksheet

For each file in the existing collection, record actual filename, dimensions, format, background/alpha behavior, visible padding/safe area, variant/state, editable source, screen IDs that use it, and recommended action (**keep / adapt / replace / retire**). Only after this pass should the team lock the final runtime filenames and generate missing assets.
