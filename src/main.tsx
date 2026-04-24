import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// NOTE: React StrictMode is intentionally not used.
// leva 0.9.35's Color component opens a popup via a layout effect that reads
// getBoundingClientRect on a ref that hasn't attached yet under StrictMode's
// double-mount, throwing and crashing the tree when the swatch is clicked.
createRoot(document.getElementById("root")!).render(<App />);
