# Screen catalog and visual review

**Purpose:** review each distinct mobile screen/state and its layout before feature implementation. The Markdown wireframes are deliberately plain, editable references—not approved production UI. Use them to adjust hierarchy and placement before committing to detailed styling or final artwork.

Open [mockups.md](./mockups.md) for all wireframes. The IDs below are the stable screen inventory; the linked heading jumps to the corresponding sketch.

| ID | Screen / state | Purpose |
|---|---|---|
| `home` | [Home](./mockups.md#home) | Create or join a decision room. |
| `your-rooms` | [Your Rooms modal](./mockups.md#your-rooms-modal) | Private Created/Joined counts and room history. |
| `create-template` | [Choose template](./mockups.md#create-room--choose-template) | Where to Eat, What to Watch, What to Do, or Custom. |
| `room-title` | [Room title](./mockups.md#create-room--title) | Name the room. |
| `deck-mode` | [Deck mode](./mockups.md#create-room--deck-mode) | Choose host-built or guest-contributed deck; do not mix modes. |
| `join-code` | [Enter code](./mockups.md#join-room--enter-code) | Enter a six-character room code. Codes are not credentials. |
| `qr-scan` | [Scan QR](./mockups.md#join-room--scan-qr) | Scan a room QR code without embedding credentials in its payload. |
| `room-transition` | [Room title transition](./mockups.md#room-title-transition) | Brief branded confirmation without host identity. |
| `host-deck-builder` | [Host deck builder](./mockups.md#host-deck-builder) | Add/edit/remove choices; maximum 100 and at least two before voting. |
| `guest-card-entry` | [Guest card entry](./mockups.md#guest-card-entry) | Add up to the configured quota of one, two, or three choices; unused slots may be skipped. |
| `host-deck-review` | [Host deck review](./mockups.md#host-deck-review) | Review and edit/remove choices until voting starts. |
| `guest-waiting` | [Guest waiting](./mockups.md#guest-waiting-for-host) | Wait while the host reviews and starts voting. |
| `voting` | [Private voting](./mockups.md#private-voting) | Vote Yep/Nah privately, one card at a time. |
| `vote-submitted` | [Vote submitted](./mockups.md#vote-submitted--waiting) | Confirm submission and show group progress without exposing individual votes. |
| `round-reveal` | [Round reveal](./mockups.md#round-reveal) | Reveal the leader or explain that a tie-breaker follows; hide totals on the winner card. |
| `vote-tallies` | [Vote tallies modal](./mockups.md#vote-tallies-modal-optional) | Optional detailed totals; remains an open MVP decision. |
| `tie-breaker` | [Tie-breaker](./mockups.md#tie-breaker-round) | Vote on only the tied choices. |
| `manual-winner` | [Manual winner](./mockups.md#host-chooses-winner-after-repeated-tie) | Host picks a winner after a repeated tie. |
| `winner` | [Final winner](./mockups.md#final-winner) | Celebrate the result and return Home. |
| `room-unavailable` | [Room unavailable](./mockups.md#room-unavailable--expired) | Recover from an expired, closed, or invalid room without identity leakage. |
| `share-code` | [Share-code modal](./mockups.md#shared-modal-share-code) | Share room code and QR. |
| `card-editor` | [Edit-choice modal](./mockups.md#shared-modal-edit-choice) | Shared editor with Save/Cancel. |
| `remove-card-confirmation` | [Remove confirmation](./mockups.md#shared-modal-remove-choice-confirmation) | Confirm removal when it meaningfully prevents accidental loss. |
| `end-voting-confirmation` | [End-voting confirmation](./mockups.md#shared-modal-end-voting-early) | Explain that submitted ballots count and missing ballots score zero. |

## Shared states that do not need their own full wireframe

Invalid code, room full, rate limited, already joined, QR permission denied/scan failure, one-minute contribution countdown/warning, 100/100 card cap, fewer than two choices, pressed/swipe feedback, connection loss/recovery, loading, saved/removed/submitted toasts, and ballot submit validation can be inline, toast, modal, or transient states.

## Open decisions

- Whether the header stays visible during voting and results.
- In-app camera scanning versus a platform QR scanner.
- Whether every choice must be rated before submission or unrated choices score zero.
- Whether vote tallies belong in the MVP.
- Exact room expiry and completed-room retention.
- Which character states need separate art versus reuse.
