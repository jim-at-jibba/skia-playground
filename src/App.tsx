import type { ComponentType } from "react";
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { version } from "canvaskit-wasm/package.json";

export default function App() {
  return (
    <WithSkiaWeb
      opts={{
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
      }}
      getComponent={
        (() =>
          import("./Playground").then((mod) => ({
            default: mod.Playground,
          }))) as () => Promise<{ default: ComponentType<object> }>
      }
      fallback={<p>Loading Skia…</p>}
    />
  );
}
