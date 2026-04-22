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
