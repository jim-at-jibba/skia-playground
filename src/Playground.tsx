import { Canvas, Circle } from "@shopify/react-native-skia";

export function Playground() {
  const size = 400;
  return (
    <Canvas style={{ width: size, height: size }}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} color="hotpink" />
    </Canvas>
  );
}
