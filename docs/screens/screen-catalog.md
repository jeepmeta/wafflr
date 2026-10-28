# Screen catalog and visual review

**Purpose:** review every distinct mobile screen/state and its asset needs before implementation. These are editable SVG wireframes, not approved UI or a promise that every state needs a separate production screen. Review each mockup, annotate changes, and consolidate redundant layouts before app logic is built.

## How to review

Open each SVG in GitHub or a vector editor. Each mockup calls out major content and intentional sprite slots. Text, spacing, components, sprite placement, and transitions are provisional. When reviewing, decide whether a state deserves a full screen, a modal, a toast, or a transient animation.

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
- **Purpose:** Private device-local room history and Created/Joined counters.

### Create room: choose template

- **ID:** `create-template`
- **Group:** Create room
- **Mockup:** [create-template.svg](mockups/create-template.svg)
- **Purpose:** Select one of the supported decision templates.

### Create room: title

- **ID:** `room-title`
- **Group:** Create room
- **Mockup:** [room-title.svg](mockups/room-title.svg)
- **Purpose:** Name the room before configuring its deck.

### Create room: deck mode

- **ID:** `deck-mode`
- **Group:** Create room
- **Mockup:** [deck-mode.svg](mockups/deck-mode.svg)
- **Purpose:** Choose host-built or guest-contributed deck; quota applies only to guest contribution mode.

### Join room: enter code

- **ID:** `join-code`
- **Group:** Join room
- **Mockup:** [join-code.svg](mockups/join-code.svg)
- **Purpose:** Enter a six-character room code without exposing participant credentials.

### Join room: scan QR

- **ID:** `qr-scan`
- **Group:** Join room
- **Mockup:** [qr-scan.svg](mockups/qr-scan.svg)
- **Purpose:** Scan a room QR code; the payload must not contain credentials.

### Room title transition

- **ID:** `room-transition`
- **Group:** Room states
- **Mockup:** [room-transition.svg](mockups/room-transition.svg)
- **Purpose:** Brief branded confirmation after joining; never display host identity.

### Host deck builder

- **ID:** `host-deck-builder`
- **Group:** Contribution
- **Mockup:** [host-deck-builder.svg](mockups/host-deck-builder.svg)
- **Purpose:** Host adds choices and sees the deck count/cap.

### Guest card entry

- **ID:** `guest-card-entry`
- **Group:** Contribution
- **Mockup:** [guest-card-entry.svg](mockups/guest-card-entry.svg)
- **Purpose:** Guest adds up to the configured number of choices and can skip unused slots.

### Host deck review

- **ID:** `host-deck-review`
- **Group:** Contribution
- **Mockup:** [host-deck-review.svg](mockups/host-deck-review.svg)
- **Purpose:** Host reviews, edits, or removes choices before locking the deck.

### Guest waiting for host

- **ID:** `guest-waiting`
- **Group:** Contribution
- **Mockup:** [guest-waiting.svg](mockups/guest-waiting.svg)
- **Purpose:** Guest waits while host reviews and starts voting.

### Private voting

- **ID:** `voting`
- **Group:** Voting
- **Mockup:** [voting.svg](mockups/voting.svg)
- **Purpose:** Private Yep/Nah card voting. Card artwork and control assets are major visual decisions.

### Vote submitted / waiting

- **ID:** `vote-submitted`
- **Group:** Voting
- **Mockup:** [vote-submitted.svg](mockups/vote-submitted.svg)
- **Purpose:** Confirmation and progress while waiting for the round to close.

### Round reveal and results

- **ID:** `round-reveal`
- **Group:** Results
- **Mockup:** [round-reveal.svg](mockups/round-reveal.svg)
- **Purpose:** Show results and winning/tied state without displaying vote totals on the winner card.

### Vote tallies modal

- **ID:** `vote-tallies`
- **Group:** Modal
- **Mockup:** [vote-tallies.svg](mockups/vote-tallies.svg)
- **Purpose:** Optional modal with vote counts sorted by Yep total.

### Tie-breaker round

- **ID:** `tie-breaker`
- **Group:** Results
- **Mockup:** [tie-breaker.svg](mockups/tie-breaker.svg)
- **Purpose:** A smaller deck containing only tied leaders.

### Host chooses winner after repeated tie

- **ID:** `manual-winner`
- **Group:** Results
- **Mockup:** [manual-winner.svg](mockups/manual-winner.svg)
- **Purpose:** Host manually chooses the winner after a repeated tie.

### Final winner

- **ID:** `winner`
- **Group:** Results
- **Mockup:** [winner.svg](mockups/winner.svg)
- **Purpose:** Celebratory final result and route back to Home.

### Room unavailable / expired

- **ID:** `room-unavailable`
- **Group:** System states
- **Mockup:** [room-unavailable.svg](mockups/room-unavailable.svg)
- **Purpose:** Friendly recovery for expired, closed, or invalid rooms without identity leakage.


## Cross-screen overlays and transient states

These may be implemented as shared overlays rather than separate routes. They still need explicit visual decisions before coding.

- Create-room title entry and template/mode selection states.
- Join-code validation, invalid code, room full, rate limited, already joined, and expired-room errors.
- QR camera permission denied and scan failure.
- Guest contribution countdown, incomplete submissions, and the one-minute lock warning.
- Card editor with Save/Cancel; remove-card confirmation only if destructive action needs confirmation.
- Maximum card count reached (100/100) and fewer than two cards available.
- Voting countdown, current-card progress, swipe feedback, Yep/Nah pressed states, and submit confirmation.
- Reconnect/loading state when realtime notifications arrive or the backend is temporarily unavailable.
- Results loading, tie announcement, tie-breaker round, repeated-tie manual winner confirmation.
- Toasts for saved, removed, submitted, and connection-recovered states.

## Open decisions that affect mockups

- Does the persistent header (wordmark, Your Rooms, count pill) appear in every state or disappear during focused voting/reveal?
- Is QR scanning in-app, or is a platform camera/scanner flow preferable?
- Does vote submission require every card to be rated, or do unrated cards count as zero? Existing planning documents are not fully aligned; decide before finalizing the submit state.
- Should vote tallies be a modal, a dedicated screen, or omitted from the MVP?
- Which error states should be inline, toast, modal, or full-screen?
- Which screens need Butters, and which need small reaction sprites versus a larger hero illustration?
