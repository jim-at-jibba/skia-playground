import {
  Blur,
  Canvas,
  Circle,
  Group,
  RadialGradient,
  SweepGradient,
  Turbulence,
  vec,
} from "@shopify/react-native-skia";
import type { OrbProps } from "./types";

const DEG_TO_RAD = Math.PI / 180;
const ROT_BREATH_DEG = 4;
const AUDIO_ROT_DEG_PER_SEC = 60;
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
    level = 0,
    breathPhase = 0,
    elapsedMs = 0,
  } = props;

  const canvasSize = Math.ceil(size * CANVAS_SCALE);
  const center = vec(canvasSize / 2, canvasSize / 2);
  const wrappedColors = [...colors, colors[0]];

  const scaleMod =
    1 + breathAmount * Math.sin(breathPhase) + audioScaleGain * level;

  const radius = (size / 2) * scaleMod;

  const highlightR = Math.max(
    0,
    Math.min(1, highlightRadius * (1 + audioHighlightGain * level)),
  ) * size * scaleMod;

  const highlightCx = center.x + (highlightX - 0.5) * size * scaleMod;
  const highlightCy = center.y + (highlightY - 0.5) * size * scaleMod;
  const highlightCenter = vec(highlightCx, highlightCy);

  const seconds = elapsedMs / 1000;
  const rotationDeg =
    rotation +
    ROT_BREATH_DEG * Math.sin(breathPhase) +
    audioRotGain * AUDIO_ROT_DEG_PER_SEC * seconds * level;
  const sweepTransform = [{ rotate: (rotationDeg - 90) * DEG_TO_RAD }];

  const turbFreq = grainScale / size;

  return (
    <Canvas style={{ width: canvasSize, height: canvasSize }}>
      <Group layer={<Blur blur={blur} />}>
        <Group transform={sweepTransform} origin={center}>
          <Circle cx={center.x} cy={center.y} r={radius}>
            <SweepGradient c={center} colors={wrappedColors} />
          </Circle>
        </Group>
        <Circle cx={highlightCx} cy={highlightCy} r={highlightR}>
          <RadialGradient
            c={highlightCenter}
            r={highlightR}
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
