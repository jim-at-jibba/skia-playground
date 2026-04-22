# Audio-Reactive Orb — Design

Date: 2026-04-22
Author: James Best

## Goal

Extend the existing Skia Orb Playground so the orb animates in response to an
audio signal. Purpose: represent an AI presence — breathing when idle,
pulsing/glowing/spinning when it "speaks". Behaves as a drop-in upgrade to the
current `<Orb>` component so the RN port path remains a file-copy.

## Non-goals

- Beat detection, FFT band-splitting, or frequency-based colour shifts
- TTS streaming infrastructure (the playground accepts any audio source; real
  AI-speech integration is downstream)
- Automated tests
- Recording / saving animation output

## Audio source

`d`-type (any `AudioNode`). Playground UI offers:

- **File picker** — user selects an audio file; piped through `<audio>` → `MediaElementAudioSourceNode`. Analyser connected to `ctx.destination` so file audio plays audibly.
- **Mic toggle** — `getUserMedia` → `MediaStreamAudioSourceNode`. NOT connected to destination (avoid feedback).
- **Stop** — disconnects the active source.

One shared `AudioContext` for the whole app; created on first user gesture.

## Signal pipeline

`useAudioSignal` hook:

1. Accepts a source union `{ kind: "file", file: File } | { kind: "mic" } | null`.
2. Builds (or reuses) the context + `AnalyserNode` (fftSize 1024, smoothingTimeConstant 0).
3. Each `requestAnimationFrame` tick:
   - `getByteTimeDomainData` into a `Uint8Array`.
   - Compute RMS over samples, centred: `rms = sqrt(mean(((s-128)/128)^2))`.
   - EMA: `level = 0.85 * level + 0.15 * rms`.
   - Clamp to `[0, 1]`.
   - Write to a `SkiaValue<number>`.
4. Returns `{ level: SkiaValue<number> }`.

`useBreath` hook:

1. Accepts `{ speedHz: number }`.
2. Each rAF tick, advances phase `p = p + 2π * speedHz * dt`, wraps at 2π.
3. Writes to a `SkiaValue<number>`.
4. Returns `{ phase: SkiaValue<number> }`.

Both hooks cancel the rAF loop on effect cleanup.

## Orb component changes

New reactive props (both optional):

```ts
level?: SkiaValue<number>;        // 0–1, defaults to constant 0
breathPhase?: SkiaValue<number>;  // radians, defaults to constant 0
```

New tuning props (numbers, slide-able via leva):

```ts
breathAmount: number;        // 0–0.1
audioScaleGain: number;      // 0–0.5
audioHighlightGain: number;  // 0–1
audioRotGain: number;        // 0–2
```

All added to `OrbProps` and to `DEFAULT_ORB_PROPS`.

Inside `Orb.tsx`, three `useComputedValue` calls derive the animated values
from the static props and the reactive inputs:

```
scaleMod      = 1 + breathAmount*sin(breathPhase) + audioScaleGain*level
effectiveSize = size * scaleMod

highlightBoost     = 1 + audioHighlightGain*level
effectiveHighlightR = clamp(highlightRadius * highlightBoost, 0, 1)

rotationTotal (deg) = rotation
                    + ROT_BREATH_DEG * sin(breathPhase)
                    + audioRotGain * (clock.ms / 1000) * 60 * level
```

Rotation uses RN Skia's `useClockValue()` (milliseconds since mount) inside a
`useComputedValue` so it advances without any manual accumulator. The base
`rotation` prop remains the static offset from the leva slider;
`ROT_BREATH_DEG` is a small internal constant (≈4°) giving the idle wobble.
The audio term spins roughly 60° per second at peak `level=1`, scaled by
`audioRotGain`.

Existing layer pipeline (sweep → highlight → blur → grain) is unchanged; only
the inputs to its shape props change.

## Playground UI

- Floating `AudioSourcePicker` top-left: file input, Mic toggle, Stop. Shows
  current-source text. Keyboard-nothing, mouse-only is fine.
- Leva gains an **Audio** folder:
  - `breathAmount` 0–0.1 step 0.005, default 0.03
  - `breathSpeed` 0.05–2 Hz step 0.05, default 0.3
  - `audioScaleGain` 0–0.5 step 0.01, default 0.15
  - `audioHighlightGain` 0–1 step 0.01, default 0.4
  - `audioRotGain` 0–2 step 0.05, default 0.6

Playground wires it all:
```
const { phase } = useBreath({ speedHz: breathSpeed });
const { level } = useAudioSignal(source);
<Orb {...orbProps} level={level} breathPhase={phase} />
```

## File layout additions

```
src/
├─ audio/
│   ├─ useAudioSignal.ts
│   ├─ useBreath.ts
│   └─ AudioSourcePicker.tsx
├─ orb/
│   ├─ Orb.tsx          (modified: accepts SkiaValues + new gain props)
│   └─ types.ts         (modified: new fields on OrbProps + DEFAULT_ORB_PROPS)
└─ Playground.tsx       (modified: wire audio + breath hooks)
```

## Defaults

Tuning numbers picked conservatively so silence ≈ subtle breathing, speech ≈
clearly alive but not frantic. All exposed via leva for live adjustment.

## Gotchas

- `AudioContext` creation must happen after a user gesture (file-pick click or
  Mic toggle). The picker encapsulates this.
- Mic requires HTTPS or localhost; localhost works for dev.
- Single shared `AudioContext` across the app lifetime; reuse via module
  singleton inside `useAudioSignal`.
- SkiaValue writes from rAF do not trigger React re-renders — intentional.
  Source changes (new file, mic toggle) DO trigger React state changes; that's
  the re-render boundary.
- Effects that own rAF loops must cancel on cleanup.
- When switching from file to mic (or stopping), disconnect the previous
  `MediaElementAudioSourceNode` / `MediaStreamAudioSourceNode` from the
  analyser before connecting the new one.

## React Native port plan

- `Orb.tsx` ports unchanged (SkiaValue API identical on native).
- `useBreath.ts` ports unchanged (`requestAnimationFrame` exists on RN).
- `useAudioSignal.ts` — Web Audio API is browser-only. Replace internals with
  a native audio lib (e.g. `react-native-audio-api`, which exposes a similar
  `AnalyserNode`). Hook signature stays the same so consumers don't change.
- `AudioSourcePicker.tsx` — rewrite for RN UI primitives. Playground-only,
  throwaway; real RN integration will feed `level` from the TTS/audio layer
  directly.

## Acceptance

- File picker accepts an audio file; orb pulses + glows + spins on peaks;
  audio is audible.
- Mic toggle asks for permission and, once granted, makes the orb react to
  voice input. No audio feedback from the speakers.
- Silence → orb breathes visibly and rotates gently.
- All leva sliders in the Audio folder change behaviour in real time.
- Stopping audio smoothly returns the orb to the idle breathing state.

## Out of scope / future

- Beat / frequency-band analysis driving colour or layer-specific effects.
- Programmatic source (feed `level` from code for testing, e.g. noise
  generator).
- Smoothing parameter exposure (EMA α fixed at 0.85 for now).
- Persisting preset param sets.
