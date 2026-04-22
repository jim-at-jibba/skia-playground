# Skia Orb Playground

Browser playground for a gradient-orb component built with
`@shopify/react-native-skia` (web build). The orb component in
`src/orb/Orb.tsx` is designed to port directly to React Native.

## Run

```bash
pnpm install
pnpm dev
```

Open http://localhost:5173. The leva panel (top-right) exposes all
orb props live.

## Layout

- `src/orb/Orb.tsx` — portable component (move this to RN later)
- `src/orb/types.ts` — `OrbProps` + defaults
- `src/Playground.tsx` — leva controls, dev-only
- `src/App.tsx` — loads CanvasKit WASM via `WithSkiaWeb`

## RN port

1. Copy `src/orb/` into the RN project.
2. Change imports: `@shopify/react-native-skia/lib/module/web` →
   `@shopify/react-native-skia`.
3. Drop `WithSkiaWeb` and `Playground` — pass props from parent screens.
