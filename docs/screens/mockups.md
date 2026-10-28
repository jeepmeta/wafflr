# Wafflr screen wireframes

These are **layout sketches, not production UI**. Use them to review hierarchy, spacing, placement, and screen flow before choosing final artwork. Nothing here is approved styling.

The examples use plain React JSX and inline styles only so the layout is easy to change. They are illustrative snippets, not wired into the app. No images, shadows, gradients, or external CSS are needed.

## Tiny layout primitives

All screen sketches below reuse these deliberately boring helpers. Change these first if you want to adjust the overall wireframe language.

```jsx
const page = { minHeight: "100vh", padding: 16, display: "flex", flexDirection: "column", gap: 16, background: "#fff", color: "#222", fontFamily: "sans-serif" };
const row = { display: "flex", alignItems: "center", gap: 8 };
const column = { display: "flex", flexDirection: "column", gap: 10 };
const panel = { border: "1px solid #bbb", borderRadius: 16, padding: 14, background: "#f7f7f7" };
const button = { border: "1px solid #888", borderRadius: 14, padding: "14px 16px", background: "#eee", textAlign: "center" };
const field = { border: "1px solid #aaa", borderRadius: 10, padding: 12, background: "#fff" };
const card = { border: "1px solid #aaa", borderRadius: 14, minHeight: 120, padding: 12, background: "#f5f5f5" };
const Header = () => <div style={{ ...row, justifyContent: "space-between" }}><div>WAFFLR</div><div style={button}>Your Rooms · 2</div></div>;
const Button = ({ children }) => <div style={button}>{children}</div>;
const Panel = ({ children }) => <div style={panel}>{children}</div>;
const Field = ({ placeholder }) => <div style={field}>{placeholder}</div>;
const Screen = ({ children, header = true }) => <div style={page}>{header && <Header />}{children}</div>;
```

---

## Home

Purpose: make the two main actions obvious. Keep the screen sparse.

```jsx
<Screen>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center" }}>
    <div style={{ fontSize: 28 }}>Butters / Wafflr wordmark</div>
    <div style={{ textAlign: "center" }}>Stop waffling. Start deciding.</div>
    <div style={{ ...column, width: "100%", maxWidth: 420, marginTop: 24 }}>
      <Button>Create Room</Button>
      <Button>Join Room</Button>
    </div>
  </div>
</Screen>
```

## Your Rooms modal

Purpose: show private Created/Joined counts and recent rooms. No names or participant list.

```jsx
<Screen>
  <Panel>
    <div style={row}><strong>Your Rooms</strong><span style={{ marginLeft: "auto" }}>Close ×</span></div>
    <div style={row}>
      <Panel>Created <strong>2</strong></Panel><Panel>Joined <strong>3</strong></Panel>
    </div>
    <div style={column}>
      <Panel>Room title · Created · Today</Panel>
      <Panel>Room title · Joined · Yesterday</Panel>
      <Panel>Room title · Created · Yesterday</Panel>
    </div>
  </Panel>
</Screen>
```

## Create room — choose template

Purpose: choose one decision template.

```jsx
<Screen>
  <h2>What are we deciding?</h2>
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
    {["Where to Eat", "What to Watch", "What to Do", "Custom"].map(x =>
      <div style={{ ...card, minHeight: 100 }} key={x}>{x}</div>
    )}
  </div>
  <Button>Continue</Button>
</Screen>
```

## Create room — title

Purpose: name the room before choosing how the deck is built.

```jsx
<Screen>
  <h2>Name your room</h2>
  <Field placeholder="e.g. Friday night" />
  <div style={{ marginTop: "auto" }}><Button>Continue</Button></div>
</Screen>
```

## Create room — deck mode

Purpose: choose one deck contribution mode; do not mix modes.

```jsx
<Screen>
  <h2>Who adds the choices?</h2>
  <Panel><strong>I'll add them</strong><div>Build the whole deck yourself.</div></Panel>
  <Panel><strong>Everyone adds choices</strong><div>Each person contributes one, two, or three.</div></Panel>
  <Button>Continue</Button>
</Screen>
```

## Join room — enter code

Purpose: enter a six-character room code or choose QR scanning.

```jsx
<Screen>
  <h2>Join a room</h2>
  <Field placeholder="A B C 1 2 3" />
  <Button>Join Room</Button>
  <div style={{ textAlign: "center" }}>or</div>
  <Button>Scan QR Code</Button>
</Screen>
```

## Join room — scan QR

Purpose: camera scan area with a clear manual fallback.

```jsx
<Screen>
  <h2>Scan room QR</h2>
  <div style={{ ...panel, aspectRatio: "1 / 1", display: "grid", placeItems: "center" }}>Camera / scan frame</div>
  <div>Point your camera at the room's QR code.</div>
  <Button>Enter code instead</Button>
</Screen>
```

## Room title transition

Purpose: short branded confirmation after joining; no host identity.

```jsx
<Screen header={false}>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: 24 }}>Butters</div>
    <h1>Friday Night Food</h1>
    <div>You're in!</div>
  </div>
</Screen>
```

## Host deck builder

Purpose: card grid scrolls while the entry form stays at the bottom. Show count out of one hundred.

```jsx
<Screen>
  <div style={row}><h2 style={{ flex: 1 }}>Add choices</h2><div>3 / 100</div></div>
  <div style={{ ...panel, flex: 1, overflow: "auto" }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <div style={card}>Choice one <span>Edit · ×</span></div>
      <div style={card}>Choice two <span>Edit · ×</span></div>
      <div style={card}>Choice three <span>Edit · ×</span></div>
    </div>
  </div>
  <Panel><Field placeholder="Restaurant or choice name" /><Button>Add Choice</Button></Panel>
  <Button>Review Deck</Button>
</Screen>
```

## Guest card entry

Purpose: show the configured one-to-three contribution slots and let guests finish early.

```jsx
<Screen>
  <div style={row}><h2 style={{ flex: 1 }}>Add your choices</h2><div>0 / 2</div></div>
  <div style={column}>
    <Panel><Field placeholder="Choice one" /></Panel>
    <Panel><Field placeholder="Choice two (optional)" /></Panel>
  </div>
  <div style={{ marginTop: "auto", ...column }}>
    <Button>Add another choice</Button>
    <Button>I'm Done</Button>
  </div>
</Screen>
```

## Host deck review

Purpose: review the shared deck and edit/remove items before voting starts.

```jsx
<Screen>
  <div style={row}><h2 style={{ flex: 1 }}>Review deck</h2><div>8 choices</div></div>
  <div style={{ ...panel, flex: 1 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <div style={card}>Choice one<br />Edit · Remove</div>
      <div style={card}>Choice two<br />Edit · Remove</div>
      <div style={card}>Choice three<br />Edit · Remove</div>
      <div style={card}>Choice four<br />Edit · Remove</div>
    </div>
  </div>
  <Button>Start Voting</Button>
</Screen>
```

## Guest waiting for host

Purpose: tell guests their choices are saved and the host is preparing the vote.

```jsx
<Screen>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: 24 }}>Butters</div>
    <h2>You're all set</h2>
    <div>Your choices are in. The host will start voting soon.</div>
    <Panel>Room code: ABC123</Panel>
  </div>
</Screen>
```

## Private voting

Purpose: one choice at a time, with obvious Yep and Nah actions. Voting stays private.

```jsx
<Screen>
  <div style={row}><span>Choice 3 of 8</span><span style={{ marginLeft: "auto" }}>Room code · ABC123</span></div>
  <div style={{ ...card, flex: 1, minHeight: 280, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
    <div>Choice artwork area</div><h2>Restaurant / choice name</h2><div>Optional category or location</div>
  </div>
  <div style={{ ...row, justifyContent: "space-around" }}>
    <Button>← Nah</Button><Button>Yep →</Button>
  </div>
  <div style={{ textAlign: "center" }}>Swipe left or right</div>
</Screen>
```

## Vote submitted / waiting

Purpose: confirm submission and show group progress without revealing individual votes.

```jsx
<Screen>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: 24 }}>Butters</div>
    <h2>Vote submitted!</h2>
    <div>Waiting for everyone else…</div>
    <Panel><div>Votes submitted</div><h2>3 of 5</h2><div style={{ ...panel, height: 12, padding: 0 }}><div style={{ width: "60%", height: "100%", background: "#bbb", borderRadius: 8 }} /></div></Panel>
    <Button>Share room code</Button>
  </div>
</Screen>
```

## Round reveal

Purpose: reveal the leading choice or explain that a tie-breaker is next. Do not show totals on the winner card.

```jsx
<Screen>
  <h2>And the results are…</h2>
  <Panel><div>Leading choice card</div><h2>Choice name</h2><div>Leading choice — totals stay off this card</div></Panel>
  <Panel><div>Another leading choice</div><div>Tied for first</div></Panel>
  <Button>Continue</Button>
</Screen>
```

## Vote tallies modal (optional)

Purpose: optional detailed totals sorted by Yep votes. Keep this out of MVP unless approved.

```jsx
<Screen>
  <Panel>
    <div style={row}><h2 style={{ flex: 1 }}>Vote tallies</h2><div>Close ×</div></div>
    {["Choice A · 4 Yep", "Choice B · 3 Yep", "Choice C · 1 Yep"].map(x =>
      <div style={{ ...panel, marginTop: 8 }} key={x}>{x}</div>
    )}
  </Panel>
</Screen>
```

## Tie-breaker round

Purpose: repeat voting with only the tied choices.

```jsx
<Screen>
  <div style={row}><h2 style={{ flex: 1 }}>Tie-breaker</h2><div>Choice 1 of 2</div></div>
  <div style={{ ...card, flex: 1, minHeight: 260, display: "grid", placeItems: "center" }}>Tied choice card</div>
  <div style={{ ...row, justifyContent: "space-around" }}><Button>← Nah</Button><Button>Yep →</Button></div>
</Screen>
```

## Host chooses winner after repeated tie

Purpose: only after a repeated tie, let the host choose between the remaining tied options.

```jsx
<Screen>
  <h2>Still tied!</h2>
  <div>Pick the final winner.</div>
  <div style={column}>
    <Panel>Choice A <span style={{ float: "right" }}>Select</span></Panel>
    <Panel>Choice B <span style={{ float: "right" }}>Select</span></Panel>
  </div>
  <Button>Confirm Winner</Button>
</Screen>
```

## Final winner

Purpose: celebrate the result and offer one clear return action.

```jsx
<Screen>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <div style={{ fontSize: 24 }}>Butters celebrates</div>
    <div>THE WINNER IS</div>
    <Panel><h1>Winning choice</h1><div>Optional category / location</div></Panel>
    <Button>Back to Home</Button>
  </div>
</Screen>
```

## Room unavailable / expired

Purpose: explain that a room cannot be opened and give a simple recovery path without revealing identities.

```jsx
<Screen>
  <div style={{ flex: 1, ...column, justifyContent: "center", alignItems: "center", textAlign: "center" }}>
    <h2>This room isn't available</h2>
    <div>It may have expired or been closed.</div>
    <Button>Back to Home</Button>
    <Button>Enter another code</Button>
  </div>
</Screen>
```

---

## Shared modal: share code

```jsx
<Panel>
  <div style={row}><h2 style={{ flex: 1 }}>Invite everyone</h2><div>Close ×</div></div>
  <div style={{ ...panel, textAlign: "center", fontSize: 28, letterSpacing: 6 }}>ABC123</div>
  <div style={{ ...panel, aspectRatio: "1 / 1", maxWidth: 180, alignSelf: "center", display: "grid", placeItems: "center" }}>QR code</div>
  <Button>Copy code</Button>
</Panel>
```

## Shared modal: edit choice

```jsx
<Panel>
  <div style={row}><h2 style={{ flex: 1 }}>Edit choice</h2><div>Close ×</div></div>
  <Field placeholder="Choice name" />
  <Field placeholder="Category / location (optional)" />
  <div style={row}><Button>Cancel</Button><Button>Save</Button></div>
</Panel>
```

## Shared modal: remove choice confirmation

```jsx
<Panel>
  <h2>Remove this choice?</h2>
  <div>It will be removed from the deck.</div>
  <div style={row}><Button>Keep it</Button><Button>Remove</Button></div>
</Panel>
```

## Shared modal: end voting early

```jsx
<Panel>
  <h2>End voting early?</h2>
  <div>Submitted votes will count. Missing ballots score zero.</div>
  <div style={row}><Button>Keep voting</Button><Button>End voting</Button></div>
</Panel>
```

---

## Shared inline states to review later

These do not need a separate layout mockup yet: invalid room code, room full, rate limit, already joined, QR permission/scan error, one-minute contribution countdown, 100/100 card limit, fewer than two choices, pressed/swipe feedback, connection loss/recovery, loading, saved/removed/submitted toasts, and ballot validation.

## Decisions deliberately left open

- Whether the header stays visible during voting and results.
- In-app camera scanning versus a platform QR scanner.
- Whether every choice must be rated before submission or unrated choices score zero.
- Whether vote tallies belong in the MVP.
- Exact room expiry and completed-room retention.
- Which Butters states need separate art versus simple reuse.
