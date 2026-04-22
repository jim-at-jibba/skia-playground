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
