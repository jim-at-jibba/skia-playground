import { useRef, useState } from "react";
import { Leva, button, useControls, folder } from "leva";
import { Orb } from "./orb/Orb";
import type { OrbColors } from "./orb/types";
import { DEFAULT_ORB_PROPS } from "./orb/types";
import { AudioSourcePicker } from "./audio/AudioSourcePicker";
import { useAudioSignal, type AudioSource } from "./audio/useAudioSignal";
import { useBreath } from "./audio/useBreath";
import { useTts } from "./audio/useTts";

type Toast = { text: string; color: string } | null;

export function Playground() {
  const [source, setSource] = useState<AudioSource>(null);
  const [toast, setToast] = useState<Toast>(null);
  const latestSettingsRef = useRef<Record<string, unknown>>({});
  const setLevaRef = useRef<((values: Record<string, unknown>) => void) | null>(
    null,
  );

  const flashToast = (text: string, color: string) => {
    setToast({ text, color });
    setTimeout(() => setToast(null), 1500);
  };

  const pasteSettings = async () => {
    const setLeva = setLevaRef.current;
    if (!setLeva) return;
    try {
      const text = await navigator.clipboard.readText();
      const obj = JSON.parse(text);
      const update: Record<string, unknown> = {};
      if (Array.isArray(obj.colors) && obj.colors.length === 4) {
        update.c0 = obj.colors[0];
        update.c1 = obj.colors[1];
        update.c2 = obj.colors[2];
        update.c3 = obj.colors[3];
      }
      if (Array.isArray(obj.colorsSpeaking) && obj.colorsSpeaking.length === 4) {
        update.c0s = obj.colorsSpeaking[0];
        update.c1s = obj.colorsSpeaking[1];
        update.c2s = obj.colorsSpeaking[2];
        update.c3s = obj.colorsSpeaking[3];
      }
      const passthrough = [
        "size",
        "highlightX",
        "highlightY",
        "highlightRadius",
        "highlightDriftAmount",
        "highlightDriftSpeed",
        "highlightCloudWarp",
        "highlightCloudNoise",
        "highlightColorHex",
        "highlightColorHexSpeaking",
        "highlightColorAlpha",
        "blur",
        "grainIntensity",
        "grainScale",
        "rotation",
        "breathAmount",
        "breathSpeed",
        "audioScaleGain",
        "audioHighlightGain",
        "audioRotGain",
      ];
      for (const k of passthrough) {
        if (k in obj) update[k] = obj[k];
      }
      if (Object.keys(update).length === 0) {
        flashToast("No matching settings in clipboard", "#ffb0b0");
        return;
      }
      setLeva(update);
      flashToast("Settings applied ✓", "#6ef56e");
    } catch (err) {
      flashToast(
        `Paste failed: ${err instanceof Error ? err.message : "unknown"}`,
        "#ffb0b0",
      );
    }
  };

  const [
    {
      size,
      c0,
      c1,
      c2,
      c3,
      c0s,
      c1s,
      c2s,
      c3s,
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
      highlightDriftAmount,
      highlightDriftSpeed,
      highlightCloudWarp,
      highlightCloudNoise,
      highlightColorHex,
      highlightColorHexSpeaking,
      highlightColorAlpha,
    },
    setLeva,
  ] = useControls(() => ({
    size: { value: DEFAULT_ORB_PROPS.size, min: 100, max: 600, step: 10 },
    "Copy settings": button(() => {
      const json = JSON.stringify(latestSettingsRef.current, null, 2);
      navigator.clipboard.writeText(json).then(
        () => flashToast("Copied to clipboard ✓", "#6ef56e"),
        () => flashToast("Clipboard write failed", "#ffb0b0"),
      );
    }),
    "Paste settings": button(() => {
      void pasteSettings();
    }),
    Colors: folder({
      c0: DEFAULT_ORB_PROPS.colors[0],
      c1: DEFAULT_ORB_PROPS.colors[1],
      c2: DEFAULT_ORB_PROPS.colors[2],
      c3: DEFAULT_ORB_PROPS.colors[3],
    }),
    "Colors (speaking)": folder({
      c0s: DEFAULT_ORB_PROPS.colorsSpeaking[0],
      c1s: DEFAULT_ORB_PROPS.colorsSpeaking[1],
      c2s: DEFAULT_ORB_PROPS.colorsSpeaking[2],
      c3s: DEFAULT_ORB_PROPS.colorsSpeaking[3],
      highlightColorHexSpeaking: DEFAULT_ORB_PROPS.highlightColorHexSpeaking,
    }),
    Highlight: folder({
      highlightX: { value: DEFAULT_ORB_PROPS.highlightX, min: 0, max: 1, step: 0.01 },
      highlightY: { value: DEFAULT_ORB_PROPS.highlightY, min: 0, max: 1, step: 0.01 },
      highlightRadius: { value: DEFAULT_ORB_PROPS.highlightRadius, min: 0, max: 1, step: 0.01 },
      highlightDriftAmount: { value: DEFAULT_ORB_PROPS.highlightDriftAmount, min: 0, max: 0.3, step: 0.01 },
      highlightDriftSpeed: { value: DEFAULT_ORB_PROPS.highlightDriftSpeed, min: 0.02, max: 0.5, step: 0.01 },
      highlightCloudWarp: { value: DEFAULT_ORB_PROPS.highlightCloudWarp, min: 0, max: 120, step: 1 },
      highlightCloudNoise: { value: DEFAULT_ORB_PROPS.highlightCloudNoise, min: 0.1, max: 3, step: 0.05 },
      highlightColorHex: DEFAULT_ORB_PROPS.highlightColorHex,
      highlightColorAlpha: {
        value: DEFAULT_ORB_PROPS.highlightColorAlpha,
        min: 0,
        max: 1,
        step: 0.01,
      },
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
  }));

  setLevaRef.current = setLeva as (values: Record<string, unknown>) => void;

  const colors: OrbColors = [c0, c1, c2, c3];
  const colorsSpeaking: OrbColors = [c0s, c1s, c2s, c3s];

  latestSettingsRef.current = {
    size,
    colors: [c0, c1, c2, c3],
    colorsSpeaking: [c0s, c1s, c2s, c3s],
    highlightX,
    highlightY,
    highlightRadius,
    highlightDriftAmount,
    highlightDriftSpeed,
    highlightCloudWarp,
    highlightCloudNoise,
    highlightColorHex,
    highlightColorHexSpeaking,
    highlightColorAlpha,
    blur,
    grainIntensity,
    grainScale,
    rotation,
    breathAmount,
    breathSpeed,
    audioScaleGain,
    audioHighlightGain,
    audioRotGain,
  };

  const { phase, elapsedMs } = useBreath(breathSpeed);
  const { level: audioLevel } = useAudioSignal(source);
  const { speak, stop: stopTts, level: ttsLevel, speaking } = useTts();

  const level = Math.max(audioLevel, ttsLevel);

  return (
    <>
      <Leva theme={{ sizes: { rootWidth: "380px", controlWidth: "180px" } }} />
      <AudioSourcePicker
        source={source}
        level={level}
        tts={{ speak, stop: stopTts, speaking }}
        onChange={setSource}
      />
      <Orb
        size={size}
        colors={colors}
        colorsSpeaking={colorsSpeaking}
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
        highlightDriftAmount={highlightDriftAmount}
        highlightDriftSpeed={highlightDriftSpeed}
        highlightCloudWarp={highlightCloudWarp}
        highlightCloudNoise={highlightCloudNoise}
        highlightColorHex={highlightColorHex}
        highlightColorHexSpeaking={highlightColorHexSpeaking}
        highlightColorAlpha={highlightColorAlpha}
        level={level}
        breathPhase={phase}
        elapsedMs={elapsedMs}
      />
      {toast ? (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 12px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.75)",
            color: toast.color,
            fontSize: 12,
            fontFamily: "system-ui, sans-serif",
            zIndex: 20,
          }}
        >
          {toast.text}
        </div>
      ) : null}
      <a
        href="https://github.com/jim-at-jibba/skia-playground"
        target="_blank"
        rel="noreferrer"
        style={{
          position: "fixed",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(0,0,0,0.55)",
          fontSize: 12,
          fontFamily: "system-ui, sans-serif",
          textDecoration: "none",
          padding: "4px 10px",
          borderRadius: 6,
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(0,0,0,0.08)",
          backdropFilter: "blur(4px)",
        }}
      >
        github.com/jim-at-jibba/skia-playground
      </a>
    </>
  );
}
