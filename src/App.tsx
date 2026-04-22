import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";

export default function App() {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={() =>
        import("./Playground").then((mod) => ({ default: mod.Playground }))
      }
      fallback={<p>Loading Skia…</p>}
    />
  );
}
