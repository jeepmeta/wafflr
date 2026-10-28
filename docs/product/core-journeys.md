# Core journeys

These journeys describe intended behavior, not completed implementation. Keep each screen focused on one decision or action and avoid adding onboarding steps unless usability testing demonstrates a need. Use the [screen catalog](../screens/screen-catalog.md) as the canonical visual inventory.

## Host: host supplies the deck

1. Home → Create Room.
2. Choose a template → enter a room title.
3. Choose “I'll add the choices.”
4. Add cards in the host deck builder; duplicates are allowed at entry.
5. Review the deck, edit or remove cards, and ensure at least two remain.
6. Start voting; the deck becomes locked.
7. Vote privately through Yep/Nah for each card and submit the ballot.
8. Wait for the round to close and see the reveal.
9. If tied, enter a tie-breaker round; if tied repeatedly, manually select the winner.
10. See the final winner and return Home.

## Host: guests contribute the deck

1. Home → Create Room.
2. Select a template and title.
3. Choose “Let everyone add choices” and set one, two, or three cards per guest.
4. Host joins the contribution flow as a guest.
5. Review the combined deck and edit/remove cards before voting starts.
6. If guests are unfinished, show a fixed one-minute completion countdown with clear warnings; then lock contributions.
7. Start voting and continue through private vote/reveal.

## Guest

1. Home → Join Room.
2. Enter the six-character room code or scan the room QR code.
3. Show the brief room-title transition without exposing host identity.
4. If the room is collecting guest choices, add up to the configured quota and tap “I'm Done”; unused slots are skipped.
5. Wait while the host reviews the deck; guest edits are allowed until voting starts.
6. Vote privately and submit.
7. Wait for reveal and see the winner.
8. A completed room cannot be rejoined to add choices or vote.

## Visual states that must be covered

The [screen catalog](../screens/screen-catalog.md) tracks the main screens plus transient/error states: invalid code, QR permission/scanning, contribution countdown, card editor, card cap, ballot progress/submission, reconnect, tie, manual winner, and expired room.

## Voting and result rules

- Only participants eligible when the round begins are included in that round's eligibility snapshot.
- A participant who leaves remains eligible; an eligible participant who never submits contributes zero Yep votes.
- A late joiner is not added to a round already in progress.
- Only submitted Yep votes count toward approval scores. Nah and missing votes do not subtract.
- Backend closure determines authoritative score and tie state.
- Tied leaders form the next tie-breaker deck. After a repeated tie, the host manually chooses the winner.
- Whether every card must be explicitly rated before ballot submission needs a final product decision; do not silently implement contradictory rules in client and server.
