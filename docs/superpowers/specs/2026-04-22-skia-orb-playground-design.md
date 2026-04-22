# Skia Orb Playground — Design

Date: 2026-04-22
Author: James Best

## Goal

Browser-based playground to build and tweak a single gradient orb component
modelled after a reference design (soft multi-hue sphere with film grain and
off-centre highlight). Component must be portable to React Native later with
minimal changes.

## Non-goals

- Multiple experiments / gallery
- Play button, label, card chrome around the orb
- Audio reactivity or animation loops (beyond static `rotation` param)
- Automated tests
- Shipping production-grade package

## Stack

- Vite + React + TypeScript
- `@shopify/react-native-skia` web build (backed by CanvasKit WASM)
- `leva` for control panel (sliders, color pickers)
- pnpm

Rationale: RN Skia's web target uses the same component API as the native
runtime, so the orb component ports to React Native by copying the file and
swapping the `WithSkiaWeb` wrapper out. Leva gives sliders and color pickers
with almost no UI code.

## Component structure

```
<App>
 └─ <WithSkiaWeb>                  ← loads CanvasKit WASM
     └─ <Playground>               ← full-screen host
          ├─ useControls(...)      ← leva params
          └─ <Orb {...params} />   ← portable artifact
```

- `Orb` is pure render, props only, no UI. This is the unit of portability.
- `Playground` is throwaway scaffolding: leva controls + layout.
- Leva floating panel sits top-right of viewport (default leva placement),
  orb rendered full-screen centered behind it.

## Orb props

```ts
type OrbProps = {
  size: number;            // px, 100–600
  colors: [string, string, string, string]; // 4 hex colors
  highlightX: number;      // 0–1, sphere-relative
  highlightY: number;      // 0–1, sphere-relative
  highlightRadius: number; // 0–1, fraction of size
  blur: number;            // 0–40 px sigma
  grainIntensity: number;  // 0–1, final-layer alpha
  grainScale: number;      // 0.5–5, turbulence frequency multiplier
  rotation: number;        // 0–360 deg
};
```

Leva panel in `Playground` mirrors these 1:1.

## Render pipeline

All layers inside a circular clip of radius `size/2`:

1. **Base sweep gradient** — `<Circle>` filled with `<SweepGradient>` using
   `colors` (repeated first color at end for seamless wrap), rotated by
   `rotation`. Produces the multi-hue wrap.
2. **Highlight** — off-centre `<Circle>` at `(highlightX*size, highlightY*size)`
   with radius `highlightRadius*size`, filled with `<RadialGradient>` from
   translucent white to transparent. Adds the bright spot.
3. **Soften** — wrap layers 1 and 2 in a `<Group>` with a Skia `<Blur
   sigma={blur}>` image filter. Keeps hue transitions smooth.
4. **Grain** — final `<Fill>` with a `<Turbulence>` shader, frequency
   proportional to `grainScale/size`, opacity = `grainIntensity`, blend mode
   `overlay`. Applied on top of the blurred base so grain stays crisp.

SweepGradient starts at 3 o'clock in Skia by default; rotate `-90°` inside the
group if the desired hue anchor is top.

## File layout

```
skia/
├─ package.json
├─ vite.config.ts          ← asset handling for canvaskit.wasm
├─ tsconfig.json
├─ index.html
├─ src/
│   ├─ main.tsx            ← React root, mounts <App>
│   ├─ App.tsx             ← <WithSkiaWeb> + <Playground>
│   ├─ Playground.tsx      ← leva controls, renders <Orb>
│   └─ orb/
│       ├─ Orb.tsx         ← portable component
│       └─ types.ts        ← OrbProps
├─ docs/superpowers/specs/2026-04-22-skia-orb-playground-design.md
├─ .gitignore
└─ README.md               ← install + run instructions
```

## Defaults (to seed leva)

Tuned to roughly match the reference image:

```ts
{
  size: 400,
  colors: ["#f4a5c0", "#e89a6a", "#d46c8a", "#b799c7"],
  highlightX: 0.35,
  highlightY: 0.3,
  highlightRadius: 0.45,
  blur: 12,
  grainIntensity: 0.12,
  grainScale: 2,
  rotation: 0,
}
```

## Gotchas

- CanvasKit WASM must be served at a resolvable URL. Two routes:
  - Use `WithSkiaWeb` which lazy-loads from a CDN-like URL; configure
    `opts.locateFile` to point to a bundled path, or
  - Copy `canvaskit.wasm` from `node_modules/canvaskit-wasm/bin/full/` into
    `public/` via `vite-plugin-static-copy`.
- RN Skia web has a different import path than native — `@shopify/react-native-skia/lib/module/web` for `WithSkiaWeb`. Rest of the API is shared.
- Turbulence shader cost scales with canvas area. At `size=600` it should
  still be fine on modern hardware; if slow, precompute a noise image once and
  reuse as `<Image>` layer.
- Leva color pickers return strings in various formats; normalize to hex or
  RGBA before passing to Skia.

## React Native port plan (future)

1. Copy `src/orb/` into the RN project.
2. Replace `@shopify/react-native-skia` web import paths with the native root
   import (`@shopify/react-native-skia`).
3. Remove `<WithSkiaWeb>` wrapper; not needed on device.
4. Delete leva + `Playground`; pass props from parent screens.

Component API stays identical.

## Acceptance

- Dev server runs with `pnpm dev`.
- Orb renders in centre of viewport.
- Leva panel exposes all params in "Orb props" above.
- Dragging any slider updates the orb in real time (no full reload).
- Default params produce a sphere visually close to the reference (multi-hue
  wrap, off-centre highlight, visible grain, soft edges).

## Out of scope / future

- Audio-reactive animation driving `rotation` or `highlightX/Y`.
- Presets (save/load param sets).
- Multiple orbs / gallery view.
- SkSL runtime-shader version of the orb for comparison.
