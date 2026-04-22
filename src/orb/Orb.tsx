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
