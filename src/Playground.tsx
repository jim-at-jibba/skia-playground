import { useState } from "react";
import { useControls, folder } from "leva";
import { Orb } from "./orb/Orb";
import type { OrbColors } from "./orb/types";
import { DEFAULT_ORB_PROPS } from "./orb/types";
import { AudioSourcePicker } from "./audio/AudioSourcePicker";
import { useAudioSignal, type AudioSource } from "./audio/useAudioSignal";
import { useBreath } from "./audio/useBreath";
import { useTts } from "./audio/useTts";

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
    highlightDriftAmount,
    highlightDriftSpeed,
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
      highlightDriftAmount: { value: DEFAULT_ORB_PROPS.highlightDriftAmount, min: 0, max: 0.3, step: 0.01 },
      highlightDriftSpeed: { value: DEFAULT_ORB_PROPS.highlightDriftSpeed, min: 0.02, max: 0.5, step: 0.01 },
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

  const { phase, elapsedMs } = useBreath(breathSpeed);
  const { level: audioLevel } = useAudioSignal(source);
  const { speak, stop: stopTts, level: ttsLevel, speaking } = useTts();

  const level = Math.max(audioLevel, ttsLevel);

  return (
    <>
      <AudioSourcePicker
        source={source}
        level={level}
        tts={{ speak, stop: stopTts, speaking }}
        onChange={setSource}
      />
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
        highlightDriftAmount={highlightDriftAmount}
        highlightDriftSpeed={highlightDriftSpeed}
        level={level}
        breathPhase={phase}
        elapsedMs={elapsedMs}
      />
    </>
  );
}
