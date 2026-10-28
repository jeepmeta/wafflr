# Decision log

Record decisions that change architecture or product behavior. Each entry should include date, status (accepted / hypothesis / open / superseded), decision, rationale, and consequences. Update relevant canonical docs when a decision changes.

## Accepted direction

### D-001 — Native-first app

- **Status:** Accepted
- **Decision:** Build iOS and Android with Expo / React Native. The web surface is a lightweight landing page, not a browser game.
- **Rationale:** Focus implementation on the intended mobile experience and avoid maintaining a second game client.

### D-002 — Shared pure game engine

- **Status:** Accepted
- **Decision:** Keep deterministic scoring and tie logic in `@wafflr/game-engine`, independent of UI and backend SDKs.
- **Rationale:** Reuse the core loop across decision templates and test it cheaply.

### D-003 — Anonymous, privacy-first participation

- **Status:** Accepted
- **Decision:** No signup, names, profiles, chat, or displayed host identity in the MVP. Use device-held anonymous credentials; room codes are not credentials.
- **Rationale:** Reduce join friction while keeping authorization separate from room discovery.

### D-004 — Shared semantic tokens

- **Status:** Accepted
- **Decision:** Use one typed token package consumed by native `StyleSheet`; no Tailwind/NativeWind styling system.
- **Rationale:** Avoid duplicate styling sources and keep shared values centrally maintained.

### Open decisions

- Final brand palette and typography.
- Whether a ballot requires an explicit Yep/Nah choice for every card before submission.
- Exact room inactivity, lifetime, and completed-room retention rules.
- Backend implementation boundary between Edge Functions and database functions.
- Whether participation without installing the app is required for the first release.
