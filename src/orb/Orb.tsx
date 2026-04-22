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
  const sweepTransform = [{ rotate: (rotation - 90) * (Math.PI / 180) }];

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={sweepTransform} origin={center}>
        <Circle cx={center.x} cy={center.y} r={radius}>
          <SweepGradient c={center} colors={wrappedColors} />
        </Circle>
      </Group>
    </Canvas>
  );
}
