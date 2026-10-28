# Screen catalog and mockups

This folder is the canonical screen-level UX reference for Wafflr. The HTML files under [mockups](./mockups/index.html) are static visual mockups for the native app—not a web game and not production components.

## Screen inventory

| ID | Screen | Mockup | Purpose |
|---|---|---|---|
| SCR-01 | Home | [home](./mockups/home.html) | Create or join a room; persistent brand/header |
| SCR-02 | Choose a decision template | [create-template](./mockups/create-template.html) | Where to eat, what to watch, what to do, custom |
| SCR-03 | Name the room | [room-title](./mockups/room-title.html) | Set the room title before configuration |
| SCR-04 | Choose deck mode | [room-mode](./mockups/room-mode.html) | Host-built deck or guest-contributed deck; quota of one, two, or three |
| SCR-05 | Join a room | [join-room](./mockups/join-room.html) | Enter six-character code or scan QR |
| SCR-06 | Host deck builder | [creator-deck-builder](./mockups/creator-deck-builder.html) | Add, edit, remove choices; cap 100; require at least two before review |
| SCR-07 | Guest choice entry | [guest-card-entry](./mockups/guest-card-entry.html) | Add up to configured quota; unused slots may be skipped |
| SCR-08 | Host deck review | [host-deck-review](./mockups/host-deck-review.html) | Review live deck, edit/remove, lock at voting start |
| SCR-09 | Waiting / collecting | [waiting-room](./mockups/waiting-room.html) | Waiting for guest contributions; share code; host can end collection with countdown |
| SCR-10 | Voting | [voting](./mockups/voting.html) | Private Yep/Nah voting with card stack; host may end early |
| SCR-11 | Ballot submitted / waiting | [vote-submitted](./mockups/vote-submitted.html) | Confirm ballot submission and wait for round closure |
| SCR-12 | Tie-breaker intro | [tiebreak-intro](./mockups/tiebreak-intro.html) | Eggin-led transition into a tie-break round |
| SCR-13 | Tie-breaker voting | [tiebreak-voting](./mockups/tiebreak-voting.html) | Same voting UI, only tied choices |
| SCR-14 | Tie-breaker wait / dance | [tiebreak-wait](./mockups/tiebreak-wait.html) | Wait for tie-break ballots and reveal |
| SCR-15 | Host final winner selection | [manual-winner](./mockups/manual-winner.html) | Host selects a winner after a repeated tie |
| SCR-16 | Winner reveal | [winner](./mockups/winner.html) | Celebrate and show the selected choice |
| SCR-17 | Your Rooms | [your-rooms](./mockups/your-rooms.html) | Private Created/Joined counts and room history |

## Reusable modal states

| ID | Modal | Mockup | Use |
|---|---|---|---|
| MOD-01 | Share room code | [share-code-modal](./mockups/share-code-modal.html) | Reuse from room collection, voting, tie-breaker, and room history |
| MOD-02 | Edit choice | [edit-card-modal](./mockups/edit-card-modal.html) | Reuse for host edits and card editor |
| MOD-03 | Destructive confirmation | [destructive-confirmation](./mockups/destructive-confirmation.html) | Confirm irreversible removal or similar action |
| MOD-04 | End voting early | [end-voting-confirmation](./mockups/end-voting-confirmation.html) | Explain that only submitted ballots count; no response contributes zero |

## Shared UI elements

These are components/states, not separate screens: loading/error/offline feedback; invalid room code; room expired; room full; minimum-deck validation; card limit reached; empty Your Rooms state; countdown warning; card removal confirmation; edit save/cancel; share-code copied feedback; ballot submit confirmation if required by the final interaction design.

Do not create separate image assets for every screen. Build screens from reusable layout/components and a small approved artwork set. Dynamic titles, room codes, card names, guest counts, and statuses should remain native text, not baked into images.

## Current limitations and decisions to review

- Mockups are placeholders and have not been usability-tested.
- The older Wafflr specification mentions a 25-card cap; the more recent product direction specifies 100. This catalog follows the newer 100-card direction.
- The older spec says “Yup”; current product direction uses “Yep.”
- The final rule for requiring every card to be rated before ballot submission remains open. Do not make the mockup imply a final rule beyond the current vote interaction.
- Room retention/inactivity behavior remains open.
- The app-store landing page is not part of the game screen catalog; it belongs to `apps/landing`.
