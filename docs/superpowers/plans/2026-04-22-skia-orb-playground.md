# Skia Orb Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser playground to tweak a multi-hue gradient orb component built with `@shopify/react-native-skia` (web build), portable to React Native later.

**Architecture:** Vite + React + TypeScript. Single `<Orb>` component (portable unit) wrapped in a `<Playground>` that exposes all props via `leva` controls. Render pipeline = sweep gradient base + radial highlight + Skia Blur image filter + Turbulence grain overlay, all clipped to a circle.

**Tech Stack:** Vite, React 18, TypeScript, `@shopify/react-native-skia`, `canvaskit-wasm`, `leva`, `pnpm`, `vite-plugin-static-copy`.

**Testing note:** Per spec, no automated tests. Verification is visual via the dev server after each task. Each task ends with "open browser, confirm X renders".

**Paths:** Project root is `/Users/jamesbest/code/lab/skia`. All commands assume that cwd unless stated.

---

## Task 1: Initialize git + scaffold Vite React-TS project

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/.git/` (via `git init`)
- Create: `/Users/jamesbest/code/lab/skia/package.json`
- Create: `/Users/jamesbest/code/lab/skia/vite.config.ts`
- Create: `/Users/jamesbest/code/lab/skia/tsconfig.json`
- Create: `/Users/jamesbest/code/lab/skia/tsconfig.node.json`
- Create: `/Users/jamesbest/code/lab/skia/index.html`
- Create: `/Users/jamesbest/code/lab/skia/src/main.tsx`
- Create: `/Users/jamesbest/code/lab/skia/src/App.tsx`
- Create: `/Users/jamesbest/code/lab/skia/.gitignore`

- [ ] **Step 1: Init git repo**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
git init -b main
```

Expected: `Initialized empty Git repository in /Users/jamesbest/code/lab/skia/.git/`

- [ ] **Step 2: Scaffold via Vite**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm create vite@latest . --template react-ts
```

If prompted about non-empty directory (the `docs/`, `logs/`, `.superpowers/` dirs exist), choose "Ignore files and continue".

Expected: files `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/`, `src/vite-env.d.ts`, `public/` created.

- [ ] **Step 3: Write `.gitignore`**

Content:
```
node_modules
dist
dist-ssr
*.local
.DS_Store
.vscode/*
!.vscode/extensions.json
.idea
.superpowers/
logs/
```

- [ ] **Step 4: Install base deps**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm install
```

Expected: `node_modules/` populated, no errors.

- [ ] **Step 5: Verify dev server runs**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: output shows `Local: http://localhost:5173/`. Open browser, confirm default Vite+React welcome page renders. Stop server with Ctrl-C.

- [ ] **Step 6: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add .
git commit -m "chore: scaffold vite react-ts project"
```

---

## Task 2: Install RN Skia + CanvasKit + leva, configure WASM copying

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/package.json` (deps added by pnpm)
- Modify: `/Users/jamesbest/code/lab/skia/vite.config.ts`

- [ ] **Step 1: Install runtime deps**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm add @shopify/react-native-skia canvaskit-wasm leva
```

Expected: packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Install dev dep for copying WASM**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm add -D vite-plugin-static-copy
```

- [ ] **Step 3: Rewrite `vite.config.ts` to copy canvaskit.wasm into build output**

Replace entire contents of `/Users/jamesbest/code/lab/skia/vite.config.ts` with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/canvaskit-wasm/bin/full/canvaskit.wasm",
          dest: ".",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["canvaskit-wasm"],
  },
});
```

- [ ] **Step 4: Run dev server to confirm WASM is served**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Open `http://localhost:5173/canvaskit.wasm` in browser. Expected: binary download (not 404). Stop server with Ctrl-C.

- [ ] **Step 5: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add package.json pnpm-lock.yaml vite.config.ts
git commit -m "chore: add react-native-skia, canvaskit, leva; copy wasm"
```

---

## Task 3: Mount `<WithSkiaWeb>` in App, render placeholder Canvas

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/App.tsx`
- Modify: `/Users/jamesbest/code/lab/skia/src/main.tsx`
- Delete: `/Users/jamesbest/code/lab/skia/src/App.css`
- Modify: `/Users/jamesbest/code/lab/skia/src/index.css`
- Create: `/Users/jamesbest/code/lab/skia/src/Playground.tsx`

- [ ] **Step 1: Replace `src/index.css` with minimal page styles**

Replace entire contents with:

```css
:root {
  color-scheme: light;
  font-family: system-ui, sans-serif;
}
html, body, #root {
  margin: 0;
  height: 100%;
  background: #f4f4f4;
}
#root {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

- [ ] **Step 2: Delete unused `App.css`**

Run:
```bash
rm /Users/jamesbest/code/lab/skia/src/App.css
```

- [ ] **Step 3: Write placeholder `Playground.tsx`**

Create `/Users/jamesbest/code/lab/skia/src/Playground.tsx`:

```tsx
import { Canvas, Circle } from "@shopify/react-native-skia";

export function Playground() {
  const size = 400;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} color="hotpink" />
    </Canvas>
  );
}
```

- [ ] **Step 4: Rewrite `App.tsx` to load Skia web then mount Playground**

Replace entire contents of `/Users/jamesbest/code/lab/skia/src/App.tsx` with:

```tsx
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

export default function App() {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={() =>
        import("./Playground").then((mod) => ({ default: mod.Playground }))
      }
      fallback={<p>Loading Skia…</p>}
    />
  );
}
```

- [ ] **Step 5: Ensure `main.tsx` imports App and index.css**

Confirm `/Users/jamesbest/code/lab/skia/src/main.tsx` contents are:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Edit if different.

- [ ] **Step 6: Run dev server, verify hotpink circle**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Open `http://localhost:5173`. Expected: brief "Loading Skia…" text, then a 400×400 hotpink circle centered on the page. Stop server.

- [ ] **Step 7: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add -A
git commit -m "feat: mount WithSkiaWeb, render placeholder canvas"
```

---

## Task 4: Define `OrbProps` type + Orb stub component

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/src/orb/types.ts`
- Create: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`
- Modify: `/Users/jamesbest/code/lab/skia/src/Playground.tsx`

- [ ] **Step 1: Write `src/orb/types.ts`**

```ts
export type OrbColors = [string, string, string, string];

export type OrbProps = {
  size: number;
  colors: OrbColors;
  highlightX: number;
  highlightY: number;
  highlightRadius: number;
  blur: number;
  grainIntensity: number;
  grainScale: number;
  rotation: number;
};

export const DEFAULT_ORB_PROPS: OrbProps = {
  size: 400,
  colors: ["#f4a5c0", "#e89a6a", "#d46c8a", "#b799c7"],
  highlightX: 0.35,
  highlightY: 0.3,
  highlightRadius: 0.45,
  blur: 12,
  grainIntensity: 0.12,
  grainScale: 2,
  rotation: 0,
};
```

- [ ] **Step 2: Write stub `src/orb/Orb.tsx` (flat color circle)**

```tsx
import { Canvas, Circle } from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

export function Orb(props: OrbProps) {
  const { size, colors } = props;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} color={colors[0]} />
    </Canvas>
  );
}
```

- [ ] **Step 3: Update `Playground.tsx` to use Orb with defaults**

Replace contents of `/Users/jamesbest/code/lab/skia/src/Playground.tsx` with:

```tsx
import { Orb } from "./orb/Orb";
import { DEFAULT_ORB_PROPS } from "./orb/types";

export function Playground() {
  return <Orb {...DEFAULT_ORB_PROPS} />;
}
```

- [ ] **Step 4: Run dev server, verify pink circle with default color #f4a5c0**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: 400×400 soft-pink circle (not hotpink). Stop server.

- [ ] **Step 5: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add -A
git commit -m "feat(orb): define OrbProps and stub component"
```

---

## Task 5: Render layer 1 — sweep gradient base

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`

- [ ] **Step 1: Update Orb to draw sweep gradient inside a circular clip**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx` with:

```tsx
import {
  Canvas,
  Circle,
  Group,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

export function Orb(props: OrbProps) {
  const { size, colors, rotation } = props;
  const center = vec(size / 2, size / 2);
  const radius = size / 2;

  // Repeat first color at end so the sweep wraps seamlessly.
  const wrappedColors = [...colors, colors[0]];

  // SweepGradient starts at 3 o'clock; offset so rotation=0 anchors at top.
  const transform = [{ rotate: (rotation - 90) * (Math.PI / 180) }];
  const origin = center;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group
        clip={{ cx: center.x, cy: center.y, r: radius }}
        transform={transform}
        origin={origin}
      >
        <Circle cx={center.x} cy={center.y} r={radius}>
          <SweepGradient c={center} colors={wrappedColors} />
        </Circle>
      </Group>
    </Canvas>
  );
}
```

- [ ] **Step 2: Run dev server, verify multi-hue sweep**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: circle shows all 4 colors swept around the centre, wrapping back to pink at the start. Sharp edges (no blur yet). Stop server.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/Orb.tsx
git commit -m "feat(orb): add sweep gradient base layer"
```

---

## Task 6: Add layer 2 — radial highlight

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`

- [ ] **Step 1: Add a highlight circle above the base**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx` with:

```tsx
import {
  Canvas,
  Circle,
  Group,
  RadialGradient,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

export function Orb(props: OrbProps) {
  const {
    size,
    colors,
    rotation,
    highlightX,
    highlightY,
    highlightRadius,
  } = props;
  const center = vec(size / 2, size / 2);
  const radius = size / 2;
  const wrappedColors = [...colors, colors[0]];

  const sweepTransform = [{ rotate: (rotation - 90) * (Math.PI / 180) }];

  const highlightCenter = vec(highlightX * size, highlightY * size);
  const highlightR = highlightRadius * size;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group clip={{ cx: center.x, cy: center.y, r: radius }}>
        <Group transform={sweepTransform} origin={center}>
          <Circle cx={center.x} cy={center.y} r={radius}>
            <SweepGradient c={center} colors={wrappedColors} />
          </Circle>
        </Group>
        <Circle cx={highlightCenter.x} cy={highlightCenter.y} r={highlightR}>
          <RadialGradient
            c={highlightCenter}
            r={highlightR}
            colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
          />
        </Circle>
      </Group>
    </Canvas>
  );
}
```

- [ ] **Step 2: Run dev server, verify soft bright spot**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: the swept circle now has a soft white highlight upper-left of centre that fades to transparent. Stop server.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/Orb.tsx
git commit -m "feat(orb): add radial highlight layer"
```

---

## Task 7: Add layer 3 — soften base + highlight with Blur image filter

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`

- [ ] **Step 1: Wrap base + highlight in a blurred Group**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx` with:

```tsx
import {
  Blur,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  SweepGradient,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

export function Orb(props: OrbProps) {
  const {
    size,
    colors,
    rotation,
    highlightX,
    highlightY,
    highlightRadius,
    blur,
  } = props;
  const center = vec(size / 2, size / 2);
  const radius = size / 2;
  const wrappedColors = [...colors, colors[0]];

  const sweepTransform = [{ rotate: (rotation - 90) * (Math.PI / 180) }];
  const highlightCenter = vec(highlightX * size, highlightY * size);
  const highlightR = highlightRadius * size;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group clip={{ cx: center.x, cy: center.y, r: radius }}>
        <Group layer={<Blur blur={blur} />}>
          <Group transform={sweepTransform} origin={center}>
            <Circle cx={center.x} cy={center.y} r={radius}>
              <SweepGradient c={center} colors={wrappedColors} />
            </Circle>
          </Group>
          <Circle cx={highlightCenter.x} cy={highlightCenter.y} r={highlightR}>
            <RadialGradient
              c={highlightCenter}
              r={highlightR}
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
            />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}
```

Note: `layer={<Blur blur={N} />}` tells RN Skia to render the group into an offscreen layer and apply the blur as an image filter.

- [ ] **Step 2: Run dev server, verify softened hues**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: colour transitions are now soft and hazy rather than sharp bands. Stop server.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/Orb.tsx
git commit -m "feat(orb): soften with Blur image filter"
```

---

## Task 8: Add layer 4 — grain overlay via Turbulence

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`

- [ ] **Step 1: Add a Turbulence-shaded Fill on top**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx` with:

```tsx
import {
  Blur,
  Canvas,
  Circle,
  Fill,
  Group,
  RadialGradient,
  SweepGradient,
  Turbulence,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

export function Orb(props: OrbProps) {
  const {
    size,
    colors,
    rotation,
    highlightX,
    highlightY,
    highlightRadius,
    blur,
    grainIntensity,
    grainScale,
  } = props;
  const center = vec(size / 2, size / 2);
  const radius = size / 2;
  const wrappedColors = [...colors, colors[0]];

  const sweepTransform = [{ rotate: (rotation - 90) * (Math.PI / 180) }];
  const highlightCenter = vec(highlightX * size, highlightY * size);
  const highlightR = highlightRadius * size;

  const turbFreq = grainScale / size;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group clip={{ cx: center.x, cy: center.y, r: radius }}>
        <Group layer={<Blur blur={blur} />}>
          <Group transform={sweepTransform} origin={center}>
            <Circle cx={center.x} cy={center.y} r={radius}>
              <SweepGradient c={center} colors={wrappedColors} />
            </Circle>
          </Group>
          <Circle cx={highlightCenter.x} cy={highlightCenter.y} r={highlightR}>
            <RadialGradient
              c={highlightCenter}
              r={highlightR}
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
            />
          </Circle>
        </Group>
        <Fill opacity={grainIntensity} blendMode="overlay">
          <Turbulence freq={vec(turbFreq, turbFreq)} octaves={2} />
        </Fill>
      </Group>
    </Canvas>
  );
}
```

- [ ] **Step 2: Run dev server, verify grain**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected: visible film-grain speckle over the blurred sphere. Grain is crisp (not blurred). Stop server.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/Orb.tsx
git commit -m "feat(orb): add turbulence grain overlay"
```

---

## Task 9: Wire leva controls into Playground

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/Playground.tsx`

- [ ] **Step 1: Replace Playground with leva-bound controls**

Replace contents of `/Users/jamesbest/code/lab/skia/src/Playground.tsx` with:

```tsx
import { useControls, folder } from "leva";
import { Orb } from "./orb/Orb";
import type { OrbColors } from "./orb/types";
import { DEFAULT_ORB_PROPS } from "./orb/types";

export function Playground() {
  const {
    size,
    c0,
    c1,
    c2,
    c3,
    highlightX,
    highlightY,
    highlightRadius,
    blur,
    grainIntensity,
    grainScale,
    rotation,
  } = useControls({
    size: { value: DEFAULT_ORB_PROPS.size, min: 100, max: 600, step: 10 },
    Colors: folder({
      c0: DEFAULT_ORB_PROPS.colors[0],
      c1: DEFAULT_ORB_PROPS.colors[1],
      c2: DEFAULT_ORB_PROPS.colors[2],
      c3: DEFAULT_ORB_PROPS.colors[3],
    }),
    Highlight: folder({
      highlightX: { value: DEFAULT_ORB_PROPS.highlightX, min: 0, max: 1, step: 0.01 },
      highlightY: { value: DEFAULT_ORB_PROPS.highlightY, min: 0, max: 1, step: 0.01 },
      highlightRadius: { value: DEFAULT_ORB_PROPS.highlightRadius, min: 0, max: 1, step: 0.01 },
    }),
    Surface: folder({
      blur: { value: DEFAULT_ORB_PROPS.blur, min: 0, max: 40, step: 0.5 },
      grainIntensity: { value: DEFAULT_ORB_PROPS.grainIntensity, min: 0, max: 1, step: 0.01 },
      grainScale: { value: DEFAULT_ORB_PROPS.grainScale, min: 0.5, max: 5, step: 0.1 },
      rotation: { value: DEFAULT_ORB_PROPS.rotation, min: 0, max: 360, step: 1 },
    }),
  });

  const colors: OrbColors = [c0, c1, c2, c3];

  return (
    <Orb
      size={size}
      colors={colors}
      highlightX={highlightX}
      highlightY={highlightY}
      highlightRadius={highlightRadius}
      blur={blur}
      grainIntensity={grainIntensity}
      grainScale={grainScale}
      rotation={rotation}
    />
  );
}
```

- [ ] **Step 2: Run dev server, verify all controls respond live**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Expected:
- Leva panel visible top-right
- Dragging `size` resizes orb in real time
- Opening `Colors` folder and changing any color picker updates orb hues
- `Highlight` folder moves and resizes bright spot
- `blur` slider softens the orb
- `grainIntensity` increases speckle visibility
- `rotation` spins the sweep gradient

Stop server.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/Playground.tsx
git commit -m "feat(playground): wire leva controls to orb props"
```

---

## Task 10: Default-params visual check + README

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/README.md`
- Modify (if needed): `/Users/jamesbest/code/lab/skia/src/orb/types.ts`

- [ ] **Step 1: Visual tuning pass**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Compare orb at default params to reference (multi-hue wrap, off-centre highlight, soft blur, visible grain, clean circular edge). If the defaults look clearly off (e.g. grain invisible, highlight barely visible), adjust the numeric values in `DEFAULT_ORB_PROPS` in `src/orb/types.ts` — within the ranges already declared in `Playground.tsx`. Do NOT add new props.

Stop server.

- [ ] **Step 2: Write `README.md`**

Create `/Users/jamesbest/code/lab/skia/README.md`:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add README.md src/orb/types.ts
git commit -m "docs: add README; tune default orb params"
```

- [ ] **Step 4: Final acceptance check**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm dev
```

Confirm all acceptance criteria from the spec:
- Dev server runs
- Orb renders centred
- Leva panel shows every prop listed in `OrbProps`
- Every slider / color picker updates the orb in real time
- Default render visually matches the reference (multi-hue wrap, off-centre highlight, soft grainy surface, clean circular edge)

Stop server.

---

## Done

Portable `<Orb>` component in `src/orb/`, playground harness around it, all spec acceptance criteria met. Ready to copy `src/orb/` into a React Native project when that work starts.
