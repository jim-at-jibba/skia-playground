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
