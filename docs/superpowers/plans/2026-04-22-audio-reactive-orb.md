# Audio-Reactive Orb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `<Orb>` with two reactive inputs — an audio-amplitude `SkiaValue` and a breathing-phase `SkiaValue` — so the orb pulses/glows/rotates to sound and gently breathes in silence. Add a playground source-picker for audio files + microphone.

**Architecture:** Two custom hooks own rAF loops writing to `SkiaValue<number>`s. A third hook gives `useClockValue` time. `<Orb>` accepts the reactive values as optional props and combines them with static tuning props via `useComputedValue` derivations feeding shape props (effective size, effective highlight radius, total rotation). Playground wires it all together and adds leva controls + a small audio-source picker.

**Tech Stack:** `@shopify/react-native-skia@1.12.4` (SkiaValue APIs), browser Web Audio API (`AudioContext`, `AnalyserNode`, `MediaElementAudioSourceNode`, `MediaStreamAudioSourceNode`), React 18, Vite 7, leva.

**Testing note:** Per spec, no automated tests. Verification per-task: `tsc --noEmit` + dev server reachability + final Playwright visual check. The final task runs Playwright against `http://localhost:5173` and confirms zero console errors plus an orb rendering.

**Paths:** Project root is `/Users/jamesbest/code/lab/skia`. All commands assume that cwd unless stated. Build on the existing `main` branch (no worktree — small incremental feature on a working baseline).

---

## Task 1: Extend `OrbProps` + defaults with new tuning fields

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/types.ts`

- [ ] **Step 1: Add reactive-input and tuning props to OrbProps**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/types.ts` with:

```ts
import type { SkiaReadonlyValue } from "@shopify/react-native-skia";

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

  // Audio-reactive tuning (numbers, not SkiaValues)
  breathAmount: number;
  audioScaleGain: number;
  audioHighlightGain: number;
  audioRotGain: number;

  // Optional SkiaValue inputs. If omitted, Orb treats them as constant 0.
  level?: SkiaReadonlyValue<number>;
  breathPhase?: SkiaReadonlyValue<number>;
};

export const DEFAULT_ORB_PROPS: Omit<OrbProps, "level" | "breathPhase"> = {
  size: 400,
  colors: ["#f4a5c0", "#e89a6a", "#d46c8a", "#b799c7"],
  highlightX: 0.35,
  highlightY: 0.3,
  highlightRadius: 0.45,
  blur: 12,
  grainIntensity: 0.12,
  grainScale: 2,
  rotation: 0,
  breathAmount: 0.03,
  audioScaleGain: 0.15,
  audioHighlightGain: 0.4,
  audioRotGain: 0.6,
};
```

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0. If tsc complains about `level`/`breathPhase` being unused in `Playground.tsx`, ignore for now — they're added in Task 6. tsc should accept because they're optional.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/types.ts
git commit -m "feat(orb): extend OrbProps with audio/breath inputs and gains"
```

---

## Task 2: Write `useBreath` hook

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/src/audio/useBreath.ts`

- [ ] **Step 1: Create the hook**

Write `/Users/jamesbest/code/lab/skia/src/audio/useBreath.ts`:

```ts
import { useEffect } from "react";
import { useValue, type SkiaMutableValue } from "@shopify/react-native-skia";

const TWO_PI = Math.PI * 2;

export function useBreath(speedHz: number): { phase: SkiaMutableValue<number> } {
  const phase = useValue(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = phase.current + TWO_PI * speedHz * dt;
      if (next > TWO_PI) next -= TWO_PI;
      phase.current = next;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedHz, phase]);

  return { phase };
}
```

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/audio/useBreath.ts
git commit -m "feat(audio): add useBreath hook"
```

---

## Task 3: Write `useAudioSignal` hook (shared context + file + mic)

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/src/audio/useAudioSignal.ts`

- [ ] **Step 1: Create the hook**

Write `/Users/jamesbest/code/lab/skia/src/audio/useAudioSignal.ts`:

```ts
import { useEffect } from "react";
import { useValue, type SkiaMutableValue } from "@shopify/react-native-skia";

export type AudioSource =
  | { kind: "file"; element: HTMLAudioElement }
  | { kind: "mic"; stream: MediaStream }
  | null;

const EMA_ALPHA = 0.15;

let sharedCtx: AudioContext | null = null;
let sharedAnalyser: AnalyserNode | null = null;

function getContext(): { ctx: AudioContext; analyser: AnalyserNode } {
  if (!sharedCtx || !sharedAnalyser) {
    sharedCtx = new AudioContext();
    sharedAnalyser = sharedCtx.createAnalyser();
    sharedAnalyser.fftSize = 1024;
    sharedAnalyser.smoothingTimeConstant = 0;
  }
  return { ctx: sharedCtx, analyser: sharedAnalyser };
}

function computeRms(buffer: Uint8Array): number {
  let sumSq = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = (buffer[i] - 128) / 128;
    sumSq += v * v;
  }
  return Math.sqrt(sumSq / buffer.length);
}

export function useAudioSignal(source: AudioSource): {
  level: SkiaMutableValue<number>;
} {
  const level = useValue(0);

  useEffect(() => {
    if (!source) return;

    const { ctx, analyser } = getContext();
    if (ctx.state === "suspended") ctx.resume();

    let node: AudioNode | null = null;
    if (source.kind === "file") {
      node = ctx.createMediaElementSource(source.element);
      node.connect(analyser);
      analyser.connect(ctx.destination);
    } else {
      node = ctx.createMediaStreamSource(source.stream);
      node.connect(analyser);
      // Mic: do NOT connect to destination (avoid feedback).
    }

    const buffer = new Uint8Array(analyser.fftSize);
    let raf = 0;
    let smoothed = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      const rms = computeRms(buffer);
      smoothed = (1 - EMA_ALPHA) * smoothed + EMA_ALPHA * rms;
      level.current = Math.min(1, Math.max(0, smoothed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      try {
        node?.disconnect();
      } catch {
        // already disconnected
      }
      if (source.kind === "file") {
        try {
          analyser.disconnect(ctx.destination);
        } catch {
          // ignore
        }
      }
      level.current = 0;
    };
  }, [source, level]);

  return { level };
}
```

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/audio/useAudioSignal.ts
git commit -m "feat(audio): add useAudioSignal hook for file + mic"
```

---

## Task 4: Write `AudioSourcePicker` component

**Files:**
- Create: `/Users/jamesbest/code/lab/skia/src/audio/AudioSourcePicker.tsx`

- [ ] **Step 1: Create the picker**

Write `/Users/jamesbest/code/lab/skia/src/audio/AudioSourcePicker.tsx`:

```tsx
import { useRef, useState } from "react";
import type { AudioSource } from "./useAudioSignal";

type Props = {
  source: AudioSource;
  onChange: (next: AudioSource) => void;
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  top: 12,
  left: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 10,
  background: "rgba(0,0,0,0.65)",
  color: "white",
  borderRadius: 8,
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  zIndex: 10,
};

const buttonStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "#333",
  color: "white",
  border: "1px solid #555",
  borderRadius: 4,
  cursor: "pointer",
};

export function AudioSourcePicker({ source, onChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.loop = true;
    void audioRef.current.play();
    setFileName(file.name);
    onChange({ kind: "file", element: audioRef.current });
  };

  const handleMic = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      onChange({ kind: "mic", stream });
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "mic denied");
    }
  };

  const handleStop = () => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (source?.kind === "mic") {
      source.stream.getTracks().forEach((t) => t.stop());
    }
    setFileName(null);
    onChange(null);
  };

  const sourceLabel =
    source === null
      ? "no audio"
      : source.kind === "mic"
        ? "mic on"
        : `file: ${fileName ?? "audio"}`;

  return (
    <div style={containerStyle}>
      <div style={{ opacity: 0.7 }}>{sourceLabel}</div>
      <label style={{ ...buttonStyle, textAlign: "center" }}>
        Choose file
        <input
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </label>
      <button type="button" style={buttonStyle} onClick={handleMic}>
        Use mic
      </button>
      <button type="button" style={buttonStyle} onClick={handleStop}>
        Stop
      </button>
      {error ? (
        <div style={{ color: "#ffb0b0" }}>{error}</div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0. The component is not yet mounted — no runtime check in this task.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/audio/AudioSourcePicker.tsx
git commit -m "feat(audio): add AudioSourcePicker component"
```

---

## Task 5: Wire reactive pipeline inside `Orb.tsx`

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx`

- [ ] **Step 1: Replace Orb with audio-reactive version**

Replace contents of `/Users/jamesbest/code/lab/skia/src/orb/Orb.tsx` with:

```tsx
import {
  Blur,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  SweepGradient,
  Turbulence,
  useClockValue,
  useComputedValue,
  useValue,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const ROT_BREATH_DEG = 4;
const AUDIO_ROT_DEG_PER_SEC = 60;
// Canvas is sized larger than the base orb so peak pulses don't clip at the
// edge. Max theoretical scale at default ranges is ~1.6; 1.7 gives margin.
const CANVAS_SCALE = 1.7;

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
    breathAmount,
    audioScaleGain,
    audioHighlightGain,
    audioRotGain,
    level: levelProp,
    breathPhase: breathPhaseProp,
  } = props;

  const fallbackLevel = useValue(0);
  const fallbackBreath = useValue(0);
  const level = levelProp ?? fallbackLevel;
  const breathPhase = breathPhaseProp ?? fallbackBreath;

  const clock = useClockValue();

  const canvasSize = Math.ceil(size * CANVAS_SCALE);
  const center = vec(canvasSize / 2, canvasSize / 2);
  const wrappedColors = [...colors, colors[0]];

  const scaleMod = useComputedValue(
    () =>
      1 +
      breathAmount * Math.sin(breathPhase.current) +
      audioScaleGain * level.current,
    [breathPhase, level]
  );

  const radius = useComputedValue(
    () => (size / 2) * scaleMod.current,
    [scaleMod]
  );

  const effectiveHighlightR = useComputedValue(() => {
    const boosted = highlightRadius * (1 + audioHighlightGain * level.current);
    return Math.max(0, Math.min(1, boosted)) * size * scaleMod.current;
  }, [level, scaleMod]);

  const highlightCx = useComputedValue(
    () => center.x + (highlightX - 0.5) * size * scaleMod.current,
    [scaleMod]
  );
  const highlightCy = useComputedValue(
    () => center.y + (highlightY - 0.5) * size * scaleMod.current,
    [scaleMod]
  );
  const highlightCenterVec = useComputedValue(
    () => vec(highlightCx.current, highlightCy.current),
    [highlightCx, highlightCy]
  );

  const rotationRad = useComputedValue(() => {
    const seconds = clock.current / 1000;
    const deg =
      rotation +
      ROT_BREATH_DEG * Math.sin(breathPhase.current) +
      audioRotGain * AUDIO_ROT_DEG_PER_SEC * seconds * level.current;
    return (deg - 90) * DEG_TO_RAD;
  }, [clock, breathPhase, level]);

  const sweepTransform = useComputedValue(
    () => [{ rotate: rotationRad.current }],
    [rotationRad]
  );

  const turbFreq = grainScale / size;

  return (
    <Canvas style={{ width: canvasSize, height: canvasSize }}>
      <Group layer={<Blur blur={blur} />}>
        <Group transform={sweepTransform} origin={center}>
          <Circle cx={center.x} cy={center.y} r={radius}>
            <SweepGradient c={center} colors={wrappedColors} />
          </Circle>
        </Group>
        <Circle cx={highlightCx} cy={highlightCy} r={effectiveHighlightR}>
          <RadialGradient
            c={highlightCenterVec}
            r={effectiveHighlightR}
            colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
          />
        </Circle>
      </Group>
      <Circle
        cx={center.x}
        cy={center.y}
        r={radius}
        opacity={grainIntensity}
        blendMode="overlay"
      >
        <Turbulence freqX={turbFreq} freqY={turbFreq} octaves={2} />
      </Circle>
    </Canvas>
  );
}
```

Notes:
- `useValue` fallbacks are always created even when external values are supplied — they're cheap and keep hook order consistent.
- Canvas is oversized by `CANVAS_SCALE` so peak pulses don't clip at the edge. The base orb visually occupies `size × size` at rest; canvas renders `ceil(size*1.7)` pixels.
- All shape props (radius, highlight position, highlight radius, rotation) are `SkiaValue`s derived via `useComputedValue`. RN Skia accepts `SkiaValue<number>` anywhere it accepts `number` for `cx`/`cy`/`r`/`transform`, and `SkiaValue<Vector>` for `RadialGradient.c`.
- Highlight position uses `(highlightX - 0.5) * size * scaleMod` so `(0.5, 0.5)` = centre; this keeps the highlight anchored relative to the oversized canvas.
- `scaleMod` drives both the sweep circle's radius AND the grain circle's radius, so grain tracks the pulse.

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/orb/Orb.tsx
git commit -m "feat(orb): audio/breath reactive pipeline via SkiaValues"
```

---

## Task 6: Wire `Playground.tsx` to source picker + hooks

**Files:**
- Modify: `/Users/jamesbest/code/lab/skia/src/Playground.tsx`

- [ ] **Step 1: Replace Playground with the wired version**

Replace contents of `/Users/jamesbest/code/lab/skia/src/Playground.tsx` with:

```tsx
import { useState } from "react";
import { useControls, folder } from "leva";
import { Orb } from "./orb/Orb";
import type { OrbColors } from "./orb/types";
import { DEFAULT_ORB_PROPS } from "./orb/types";
import { AudioSourcePicker } from "./audio/AudioSourcePicker";
import { useAudioSignal, type AudioSource } from "./audio/useAudioSignal";
import { useBreath } from "./audio/useBreath";

export function Playground() {
  const [source, setSource] = useState<AudioSource>(null);

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
    breathAmount,
    breathSpeed,
    audioScaleGain,
    audioHighlightGain,
    audioRotGain,
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
    Audio: folder({
      breathAmount: { value: DEFAULT_ORB_PROPS.breathAmount, min: 0, max: 0.1, step: 0.005 },
      breathSpeed: { value: 0.3, min: 0.05, max: 2, step: 0.05 },
      audioScaleGain: { value: DEFAULT_ORB_PROPS.audioScaleGain, min: 0, max: 0.5, step: 0.01 },
      audioHighlightGain: { value: DEFAULT_ORB_PROPS.audioHighlightGain, min: 0, max: 1, step: 0.01 },
      audioRotGain: { value: DEFAULT_ORB_PROPS.audioRotGain, min: 0, max: 2, step: 0.05 },
    }),
  });

  const colors: OrbColors = [c0, c1, c2, c3];

  const { phase } = useBreath(breathSpeed);
  const { level } = useAudioSignal(source);

  return (
    <>
      <AudioSourcePicker source={source} onChange={setSource} />
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
        breathAmount={breathAmount}
        audioScaleGain={audioScaleGain}
        audioHighlightGain={audioHighlightGain}
        audioRotGain={audioRotGain}
        level={level}
        breathPhase={phase}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify tsc**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
pnpm exec tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 3: Verify dev server boots with no errors**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
kill $(lsof -ti:5173) 2>/dev/null
find node_modules/.vite -mindepth 1 -delete 2>/dev/null || true
nohup pnpm dev > /tmp/vite-log.txt 2>&1 &
sleep 10
curl -s http://localhost:5173/ -o /dev/null -w "%{http_code}\n"
tail -20 /tmp/vite-log.txt
kill $(lsof -ti:5173) 2>/dev/null
```

Expected: HTTP 200, Vite log shows "ready in Nms", no error lines.

- [ ] **Step 4: Commit**

```bash
cd /Users/jamesbest/code/lab/skia
git add src/Playground.tsx
git commit -m "feat(playground): wire audio picker + hooks + Audio leva folder"
```

---

## Task 7: End-to-end browser verification via Playwright

**Files:** none created or modified (verification only).

- [ ] **Step 1: Launch dev server**

Run:
```bash
cd /Users/jamesbest/code/lab/skia
kill $(lsof -ti:5173) 2>/dev/null
find node_modules/.vite -mindepth 1 -delete 2>/dev/null || true
nohup pnpm dev > /tmp/vite-log.txt 2>&1 &
sleep 8
curl -s http://localhost:5173/ -o /dev/null -w "%{http_code}\n"
```

Expected: `200`.

- [ ] **Step 2: Navigate Playwright to the playground**

Use the `mcp__plugin_playwright_playwright__browser_navigate` tool with `url: "http://localhost:5173"`.

Expected return includes `Page Title: skia` and no errors in the console section.

- [ ] **Step 3: Assert zero console errors**

Use `mcp__plugin_playwright_playwright__browser_console_messages` with `level: "error"`.

Expected: `Errors: 0`.

- [ ] **Step 4: Snapshot and confirm orb + leva panel render**

Use `mcp__plugin_playwright_playwright__browser_take_screenshot` with `filename: "audio-reactive-orb.png"` and `type: "png"`.

Manually inspect the returned screenshot for:
- An orb near the viewport centre with multi-hue gradient + soft blur.
- A dark leva panel top-right listing `size`, `Colors`, `Highlight`, `Surface`, `Audio`.
- A dark `AudioSourcePicker` panel top-left with "Choose file" / "Use mic" / "Stop" buttons and "no audio" label.

- [ ] **Step 5: Stop dev server**

Run:
```bash
kill $(lsof -ti:5173) 2>/dev/null
```

- [ ] **Step 6: Commit the screenshot + update .gitignore if needed**

If `audio-reactive-orb.png` is at the repo root and `.gitignore` already excludes it (matches `orb-first-render.png` pattern), there's nothing to commit. Otherwise:

```bash
cd /Users/jamesbest/code/lab/skia
git status
```

If the screenshot is untracked and would be committed, add it to `.gitignore`:

```bash
echo "audio-reactive-orb.png" >> .gitignore
git add .gitignore
git commit -m "chore: ignore audio-reactive-orb screenshot"
```

If `.gitignore` already covers it (or the repo is clean), skip this commit.

---

## Done

Portable `<Orb>` now accepts optional `SkiaValue<number>` inputs for audio amplitude and breathing phase; `Playground` supplies both via dedicated hooks and a source picker. Copy `src/orb/` + `src/audio/{useAudioSignal.ts,useBreath.ts}` into the RN project when porting, and swap the Web-Audio internals of `useAudioSignal` for a native audio lib (e.g. `react-native-audio-api`) while keeping the hook signature stable.
