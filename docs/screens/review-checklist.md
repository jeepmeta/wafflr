# Screen review checklist

Review every mockup before feature implementation. Record decisions in the catalog or the relevant product decision log.

## Per-screen review

- [ ] Is this a full screen, modal, overlay, toast, or transient animation?
- [ ] Is the screen necessary, or can it be merged with another without adding confusion?
- [ ] Are the primary action and exit/back action obvious?
- [ ] Is any copy redundant?
- [ ] Which existing asset should be reused for each element?
- [ ] Where does Butters appear, at what scale, and what is the entry/exit animation?
- [ ] Are sprite animation and interactive hit areas kept separate?
- [ ] Does the layout work on small Android devices and larger phones?
- [ ] What are the loading, error, disabled, and pressed states?
- [ ] Is the design accessible with reduced motion and readable contrast?

## Cross-screen review

- [ ] Header behavior is consistent and intentionally hidden only where needed.
- [ ] Buttons, cards, panels, pills, badges, and modal frames are reused instead of duplicated.
- [ ] Dynamic labels remain native text rather than being baked into images.
- [ ] Every asset has at least one documented screen use.
- [ ] Every required visual element maps to an existing asset or an approved new asset.
- [ ] Redundant assets are marked reuse / replace / retire before generation.
- [ ] Host and guest journeys cover every catalogued screen and state.
- [ ] No production game logic or backend work begins until the owner approves the screen map and asset plan.
