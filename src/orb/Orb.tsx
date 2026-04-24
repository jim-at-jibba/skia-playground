import type { FC, ReactNode, CSSProperties } from "react";
import {
  Blur,
  Canvas as SkiaCanvas,
  Circle,
  DisplacementMap,
  Group,
  RadialGradient,
  Skia,
  SweepGradient,
  Turbulence,
  vec,
} from "@shopify/react-native-skia";
import type { OrbColors, OrbProps } from "./types";

// RN Skia 1.12 ships an incomplete Canvas type (ViewProps resolves to {} because
// @types/react-native isn't installed). Re-type locally to accept children/style.
const Canvas = SkiaCanvas as unknown as FC<{
  children?: ReactNode;
  style?: CSSProperties;
}>;

const DEG_TO_RAD = Math.PI / 180;
const ROT_BREATH_DEG = 4;
const AUDIO_ROT_DEG_PER_SEC = 60;
const CANVAS_SCALE = 1.7;
// Irrational-ish ratio so x/y drift never lines up perfectly → organic wander.
const DRIFT_Y_RATIO = 0.83;

// Parse a 3- or 6-digit hex color to its RGB components.
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace(/^#/, "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// Linearly interpolate two hex colors in RGB space at t in [0, 1].
function lerpHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  );
}

export function Orb(props: OrbProps) {
  const {
    size,
    colors,
    colorsSpeaking,
    rotation,
    highlightX,
    highlightY,
    highlightRadius,
    blur,
    grainIntensity,
    grainScale,
    breathAmount,
    audioScaleGain,
    audioHighlightGain,
    audioRotGain,
    highlightDriftAmount,
    highlightDriftSpeed,
    highlightCloudWarp,
    highlightCloudNoise,
    highlightColorHex,
    highlightColorHexSpeaking,
    highlightColorAlpha,
    level = 0,
    breathPhase = 0,
    elapsedMs = 0,
  } = props;

  const canvasSize = Math.ceil(size * CANVAS_SCALE);
  const center = vec(canvasSize / 2, canvasSize / 2);

  // Blend rest → speaking palette by audio level.
  const blendedColors: OrbColors = [
    lerpHex(colors[0], colorsSpeaking[0], level),
    lerpHex(colors[1], colorsSpeaking[1], level),
    lerpHex(colors[2], colorsSpeaking[2], level),
    lerpHex(colors[3], colorsSpeaking[3], level),
  ];
  const wrappedColors = [...blendedColors, blendedColors[0]];
  const blendedHighlightHex = lerpHex(
    highlightColorHex,
    highlightColorHexSpeaking,
    level,
  );

  const scaleMod =
    1 + breathAmount * Math.sin(breathPhase) + audioScaleGain * level;

  const radius = (size / 2) * scaleMod;

  const highlightR = Math.max(
    0,
    Math.min(1, highlightRadius * (1 + audioHighlightGain * level)),
  ) * size * scaleMod;

  const seconds = elapsedMs / 1000;

  const driftPhaseX = seconds * highlightDriftSpeed * Math.PI * 2;
  const driftPhaseY = seconds * highlightDriftSpeed * DRIFT_Y_RATIO * Math.PI * 2;
  const driftedX = highlightX + highlightDriftAmount * Math.sin(driftPhaseX);
  const driftedY = highlightY + highlightDriftAmount * Math.cos(driftPhaseY);

  const highlightCx = center.x + (driftedX - 0.5) * size * scaleMod;
  const highlightCy = center.y + (driftedY - 0.5) * size * scaleMod;
  const highlightCenter = vec(highlightCx, highlightCy);
  const rotationDeg =
    rotation +
    ROT_BREATH_DEG * Math.sin(breathPhase) +
    audioRotGain * AUDIO_ROT_DEG_PER_SEC * seconds * level;
  const sweepTransform = [{ rotate: (rotationDeg - 90) * DEG_TO_RAD }];

  const turbFreq = grainScale / size;

  const { r: hr, g: hg, b: hb } = hexToRgb(blendedHighlightHex);
  const highlightRgba = `rgba(${hr}, ${hg}, ${hb}, ${highlightColorAlpha})`;
  const highlightRgbaEnd = `rgba(${hr}, ${hg}, ${hb}, 0)`;

  // Clip the displaced highlight to the sphere so turbulence-warped pixels
  // don't bleed outside the orb.
  const sphereClip = Skia.Path.Make();
  sphereClip.addCircle(center.x, center.y, radius);

  return (
    <Canvas style={{ width: canvasSize, height: canvasSize }}>
      <Group layer={<Blur blur={blur} />}>
        <Group transform={sweepTransform} origin={center}>
          <Circle cx={center.x} cy={center.y} r={radius}>
            <SweepGradient c={center} colors={wrappedColors} />
          </Circle>
        </Group>
        <Group clip={sphereClip}>
          <Group
            layer={
              <DisplacementMap
                channelX="r"
                channelY="g"
                scale={highlightCloudWarp}
              >
                <Turbulence
                  freqX={highlightCloudNoise * 0.02}
                  freqY={highlightCloudNoise * 0.02}
                  octaves={3}
                />
              </DisplacementMap>
            }
          >
            <Circle cx={highlightCx} cy={highlightCy} r={highlightR}>
              <RadialGradient
                c={highlightCenter}
                r={highlightR}
                colors={[highlightRgba, highlightRgbaEnd]}
              />
            </Circle>
          </Group>
        </Group>
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
