import type { SkiaReadonlyValue } from "@shopify/react-native-skia";

export type OrbColors = [string, string, string, string];

export type OrbProps = {
  size: number;
  colors: OrbColors;
  highlightX: number;
  highlightY: number;
  highlightRadius: number;
  blur: number;
  grainIntensity: number;
  grainScale: number;
  rotation: number;

  // Audio-reactive tuning (numbers, not SkiaValues)
  breathAmount: number;
  audioScaleGain: number;
  audioHighlightGain: number;
  audioRotGain: number;

  // Optional SkiaValue inputs. If omitted, Orb treats them as constant 0.
  level?: SkiaReadonlyValue<number>;
  breathPhase?: SkiaReadonlyValue<number>;
};

export const DEFAULT_ORB_PROPS: Omit<OrbProps, "level" | "breathPhase"> = {
  size: 400,
  colors: ["#f4a5c0", "#e89a6a", "#d46c8a", "#b799c7"],
  highlightX: 0.35,
  highlightY: 0.3,
  highlightRadius: 0.45,
  blur: 12,
  grainIntensity: 0.12,
  grainScale: 2,
  rotation: 0,
  breathAmount: 0.03,
  audioScaleGain: 0.15,
  audioHighlightGain: 0.4,
  audioRotGain: 0.6,
};
