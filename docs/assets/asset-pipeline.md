# Asset pipeline

## Source of truth

- Keep editable/source artwork separate from runtime exports.
- Store brand source files and asset inventories under `assets/`; store app-ready exports under `apps/mobile/assets/` with a clear mapping from source to export.
- Do not overwrite original source artwork during optimization.
- Use descriptive, stable filenames with lowercase kebab-case and explicit state/variant suffixes.

## Runtime formats

- Prefer WebP for reusable branded UI and character illustrations when supported by the target rendering path.
- Use platform-required PNG assets for app icons, adaptive icons, and splash screens where required by Expo.
- Do not bake dynamic text into reusable controls.
- Avoid baking drop shadows into generator outputs. Document intentional shadows/effects separately.
- Ensure generated source assets have clean white backgrounds when that is the requested asset format; do not mistake a checkerboard preview for transparency.

## Suggested folders

```text
assets/
  source/              # editable originals / source exports
  brand/               # wordmark and identity files
  characters/butters/  # Butters expressions and animation frames
  ui/                  # buttons, panels, pills, badges, card frames
  social/              # external social marks where approved
  inventory.md         # canonical asset manifest
apps/mobile/assets/
  images/
  ui/
  characters/
```

Create subfolders as assets are approved rather than filling the repository with empty directories. Record each runtime file's filename, intended use, pixel dimensions, padding/safe area, format, source file, and licensing/ownership status.

## Asset QA checklist

- Correct dimensions and consistent visual scale.
- White background where specified; no unintended checkerboard.
- No unexpected shadow or glow.
- Text and logos are legible at expected rendered size.
- Variants align and share consistent padding.
- Compression does not visibly damage edges.
- Asset is referenced in the inventory and used by a component registry or documented consumer.
