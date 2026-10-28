# Screen catalog and visual review

**Purpose:** review every distinct mobile screen/state and its asset needs before implementation. These editable SVG wireframes are draft references, not approved UI or a promise that every state needs a separate production screen. Review each mockup, annotate changes, and consolidate redundant layouts before app logic is built.

## How to review

Open each SVG in GitHub or a vector editor. Text, spacing, components, sprite placement, and transitions are provisional. Decide whether each state deserves a full screen, modal, toast, or transient animation. The catalog below is the source of truth for screen IDs.

## Screens

### Home
- **ID:** `home`
- **Group:** Core
- **Mockup:** [home.svg](mockups/home.svg)
- **Purpose:** Primary entry point for creating or joining a decision room.

### Your Rooms modal
- **ID:** `your-rooms`
- **Group:** Modal
- **Mockup:** [your-rooms.svg](mockups/your-rooms.svg)
- **Purpose:** Private Created/Joined counters and room history.

### Create room: choose template
- **ID:** `create-template`
- **Group:** Create room
- **Mockup:** [create-template.svg](mockups/create-template.svg)
- **Purpose:** Select Where to Eat, What to Watch, What to Do, or Custom.

### Create room: title
- **ID:** `room-title`
- **Group:** Create room
- **Mockup:** [room-title.svg](mockups/room-title.svg)
- **Purpose:** Name the room before configuring its deck.

### Create room: deck mode
- **ID:** `deck-mode`
- **Group:** Create room
- **Mockup:** [deck-mode.svg](mockups/deck-mode.svg)
- **Purpose:** Choose host-built or guest-contributed deck; quota applies only to guest mode.

### Join room: enter code
- **ID:** `join-code`
- **Group:** Join room
- **Mockup:** [join-code.svg](mockups/join-code.svg)
- **Purpose:** Enter a six-character room code. Room codes are not credentials.

### Join room: scan QR
- **ID:** `qr-scan`
- **Group:** Join room
- **Mockup:** [qr-scan.svg](mockups/qr-scan.svg)
- **Purpose:** Scan a room QR code; payload must not contain participant credentials.

### Room title transition
- **ID:** `room-transition`
- **Group:** Room states
- **Mockup:** [room-transition.svg](mockups/room-transition.svg)
- **Purpose:** Brief branded confirmation after joining, without host identity.

### Host deck builder
- **ID:** `host-deck-builder`
- **Group:** Contribution
- **Mockup:** [host-deck-builder.svg](mockups/host-deck-builder.svg)
- **Purpose:** Host adds, edits, and removes choices; cap is 100 cards, minimum two before voting.

### Guest card entry
- **ID:** `guest-card-entry`
- **Group:** Contribution
- **Mockup:** [guest-card-entry.svg](mockups/guest-card-entry.svg)
- **Purpose:** Guest adds up to the configured quota of one, two, or three choices; unused slots may be skipped.

### Host deck review
- **ID:** `host-deck-review`
- **Group:** Contribution
- **Mockup:** [host-deck-review.svg](mockups/host-deck-review.svg)
- **Purpose:** Host reviews and edits/removes choices until voting starts.

### Guest waiting for host
- **ID:** `guest-waiting`
- **Group:** Contribution
- **Mockup:** [guest-waiting.svg](mockups/guest-waiting.svg)
- **Purpose:** Guest waits while host reviews and starts voting.

### Private voting
- **ID:** `voting`
- **Group:** Voting
- **Mockup:** [voting.svg](mockups/voting.svg)
- **Purpose:** Private Yep/Nah card voting.

### Vote submitted / waiting
- **ID:** `vote-submitted`
- **Group:** Voting
- **Mockup:** [vote-submitted.svg](mockups/vote-submitted.svg)
- **Purpose:** Confirmation and progress while waiting for round closure.

### Round reveal and results
- **ID:** `round-reveal`
- **Group:** Results
- **Mockup:** [round-reveal.svg](mockups/round-reveal.svg)
- **Purpose:** Show winner or tied leaders. Winner card does not display vote totals.

### Vote tallies modal
- **ID:** `vote-tallies`
- **Group:** Modal
- **Mockup:** [vote-tallies.svg](mockups/vote-tallies.svg)
- **Purpose:** Optional tally modal sorted by Yep total; keep as a product decision until approved.

### Tie-breaker round
- **ID:** `tie-breaker`
- **Group:** Results
- **Mockup:** [tie-breaker.svg](mockups/tie-breaker.svg)
- **Purpose:** A smaller voting deck containing only tied leaders.

### Host chooses winner after repeated tie
- **ID:** `manual-winner`
- **Group:** Results
- **Mockup:** [manual-winner.svg](mockups/manual-winner.svg)
- **Purpose:** Host manually chooses the final winner after a repeated tie.

### Final winner
- **ID:** `winner`
- **Group:** Results
- **Mockup:** [winner.svg](mockups/winner.svg)
- **Purpose:** Celebratory final result and route back to Home.

### Room unavailable / expired
- **ID:** `room-unavailable`
- **Group:** System states
- **Mockup:** [room-unavailable.svg](mockups/room-unavailable.svg)
- **Purpose:** Recovery for expired, closed, or invalid rooms without identity leakage.

## Shared modal mockups

- **Share code:** [share-code.svg](mockups/share-code.svg) — reusable from collection, voting, tie-breaker, and room history.
- **Edit choice:** [card-editor.svg](mockups/card-editor.svg) — shared editor with Save/Cancel.
- **Remove choice confirmation:** [remove-card-confirmation.svg](mockups/remove-card-confirmation.svg) — use only when confirmation meaningfully prevents accidental loss.
- **End voting early:** [end-voting-confirmation.svg](mockups/end-voting-confirmation.svg) — explains that submitted ballots count and missing ballots score zero.

## Shared states that do not need their own full-screen mockup

Invalid code, room full, rate limited, already joined, QR permission denied/scan failure, one-minute contribution countdown/warning, 100/100 card cap, fewer than two cards, pressed/swipe feedback, connection loss/recovery, loading, saved/removed/submitted toasts, and ballot submit validation. Choose inline, toast, modal, or full-screen treatment during review.

## Open decisions

- Persistent header visibility during focused voting and reveal.
- Whether QR scanning uses in-app camera access or a platform scanner flow.
- Whether every card must be explicitly rated before ballot submission or unvoted cards count as zero. Do not silently implement conflicting rules.
- Whether vote tallies belong in the MVP.
- Exact room expiry and completed-room retention.
- Which character states merit distinct artwork versus reuse of one sprite with layout/animation changes.
