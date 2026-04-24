export type OrbColors = [string, string, string, string];

export type OrbProps = {
  size: number;
  colors: OrbColors;
  colorsSpeaking: OrbColors;
  highlightX: number;
  highlightY: number;
  highlightRadius: number;
  blur: number;
  grainIntensity: number;
  grainScale: number;
  rotation: number;

  breathAmount: number;
  audioScaleGain: number;
  audioHighlightGain: number;
  audioRotGain: number;

  highlightDriftAmount: number;
  highlightDriftSpeed: number;
  highlightCloudWarp: number;
  highlightCloudNoise: number;
  highlightColorHex: string;
  highlightColorHexSpeaking: string;
  highlightColorAlpha: number;

  level?: number;
  breathPhase?: number;
  elapsedMs?: number;
};

export const DEFAULT_ORB_PROPS: Omit<OrbProps, "level" | "breathPhase" | "elapsedMs"> = {
  size: 400,
  colors: ["#f4a5c0", "#e89a6a", "#d46c8a", "#b799c7"],
  colorsSpeaking: ["#6ad0e8", "#9b7ce0", "#e079b8", "#e8a56a"],
  highlightX: 0.35,
  highlightY: 0.3,
  highlightRadius: 0.45,
  blur: 2.5,
  grainIntensity: 0.12,
  grainScale: 2,
  rotation: 0,
  breathAmount: 0.03,
  audioScaleGain: 0.15,
  audioHighlightGain: 0.4,
  audioRotGain: 0,
  highlightDriftAmount: 0.12,
  highlightDriftSpeed: 0.12,
  highlightCloudWarp: 60,
  highlightCloudNoise: 1.2,
  highlightColorHex: "#ffffff",
  highlightColorHexSpeaking: "#cfe0ff",
  highlightColorAlpha: 0.75,
};
