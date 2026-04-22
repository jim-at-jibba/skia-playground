import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: "react-native-web" },
      {
        find: "react-native/Libraries/Image/AssetRegistry",
        replacement: path.resolve(__dirname, "src/shims/empty.ts"),
      },
      {
        find: "react-native/Libraries/Utilities/codegenNativeComponent",
        replacement: path.resolve(__dirname, "src/shims/empty.ts"),
      },
    ],
    extensions: [
      ".web.tsx",
      ".web.ts",
      ".web.jsx",
      ".web.js",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  optimizeDeps: {
    include: ["canvaskit-wasm", "@shopify/react-native-skia", "react-native-web"],
    esbuildOptions: {
      resolveExtensions: [".web.js", ".web.ts", ".web.tsx", ".mjs", ".js", ".jsx", ".ts", ".tsx", ".json"],
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    __DEV__: JSON.stringify(true),
    global: "globalThis",
  },
});
