# Wafflr product brief

## Product promise

Wafflr helps a group stop debating and reach a shared decision through a tiny social game. The desired feeling is relief and momentum—not a longer AI conversation or another group-chat thread.

**Working tagline:** “Stop waffling. Start deciding.” Treat this as a positioning direction, not a permanently locked tagline.

## Core loop

**Decision → Deck → Vote → Reveal → Winner**

1. A host creates a room and chooses a decision template.
2. The room's choices are assembled into a deck.
3. Participants privately vote on each choice.
4. The round closes and results are revealed.
5. One winner is selected; a tie can trigger a smaller tie-breaker round.

The engine should be reusable across templates. Restaurants are the first practical template, not the final product scope.

## MVP hypothesis

- Native iOS and Android app using Expo / React Native.
- Restaurant selection as the first polished template.
- Room creation and a six-character room code.
- Join by entering a room code or scanning a QR code; avoid deep-link-based joining in the initial security model.
- Two deck modes: host supplies all choices, or guests contribute choices. Do not mix modes in one room.
- Guests can contribute a configured quota of one, two, or three cards; unused slots may be skipped.
- Host reviews and may edit/remove cards before voting starts.
- At least two eligible cards are required to begin voting; the room deck is capped at 100 cards.
- Voting uses “Yep” and “Nah.” The score is the number of Yep votes; Nah and missing votes do not subtract.
- Tied leaders move to a tie-breaker deck. If the group ties again, the host manually selects the final winner.
- No signup, chat, participant names, nicknames, public profiles, or displayed host identity.
- Completed rooms are retained only for a short, documented period; exact retention and inactivity rules remain to be confirmed.

## Out of scope for initial MVP

- Browser-based game.
- Chat, public participant list, profile system, account recovery/linking.
- Restaurant imagery, external listing enrichment, and map-based discovery as core requirements.
- AI-generated recommendations or open-ended AI conversation.
- Monetization mechanics before evidence supports them.
- Multiple simultaneous decisions in one room.

## Product principles

- Reduce friction and decision anxiety.
- Keep interactions understandable without instruction screens.
- Use purposeful, brief animation and Butters reactions to reinforce game state.
- Prefer a few polished interactions over broad feature coverage.
- Design templates as configuration over one reusable engine.
- Measure whether groups reach a result quickly and whether participants start additional rooms.

## Open hypotheses to validate

- Whether users will install an app for a group decision or need a lightweight invite/participation path.
- Whether room-code/QR joining creates enough friction compared with share links.
- Whether requiring every card to be rated improves confidence or creates abandonment.
- The right room inactivity and completed-room retention windows.
- Whether restaurants alone create enough repeat usage before adding templates.
