import { useRef, useState } from "react";
import type { AudioSource } from "./useAudioSignal";

type TtsHandlers = {
  speak: (text: string) => void;
  stop: () => void;
  speaking: boolean;
};

type Props = {
  source: AudioSource;
  level: number;
  tts: TtsHandlers;
  onChange: (next: AudioSource) => void;
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  top: 12,
  left: 12,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  padding: 10,
  background: "rgba(0,0,0,0.65)",
  color: "white",
  borderRadius: 8,
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  zIndex: 10,
  minWidth: 160,
};

const buttonStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "#333",
  color: "white",
  border: "1px solid #555",
  borderRadius: 4,
  cursor: "pointer",
};

const meterTrackStyle: React.CSSProperties = {
  height: 6,
  background: "#222",
  borderRadius: 3,
  overflow: "hidden",
};

const meterLabelStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 10,
  opacity: 0.7,
};

export function AudioSourcePicker({ source, level, tts, onChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState(
    "Hello. I'm a synthetic voice talking to test the orb animation.",
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.crossOrigin = "anonymous";
    audioRef.current.loop = true;
    void audioRef.current.play();
    setFileName(file.name);
    onChange({ kind: "file", element: audioRef.current });
  };

  const handleMic = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      onChange({ kind: "mic", stream });
      setFileName(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "mic denied");
    }
  };

  const handleStop = () => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (source?.kind === "mic") {
      source.stream.getTracks().forEach((t) => t.stop());
    }
    setFileName(null);
    onChange(null);
  };

  const sourceLabel =
    source === null
      ? "no audio"
      : source.kind === "mic"
        ? "mic on"
        : `file: ${fileName ?? "audio"}`;

  const active = source !== null;
  const percent = Math.round(level * 100);
  const meterFillColor = level > 0.05 ? "#6ef56e" : "#555";

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: active ? "#6ef56e" : "#555",
          }}
        />
        <span style={{ opacity: 0.9 }}>{sourceLabel}</span>
      </div>

      <div>
        <div style={meterLabelStyle}>
          <span>level</span>
          <span>{percent}%</span>
        </div>
        <div style={meterTrackStyle}>
          <div
            style={{
              height: "100%",
              width: `${percent}%`,
              background: meterFillColor,
              transition: "width 60ms linear",
            }}
          />
        </div>
      </div>

      <label style={{ ...buttonStyle, textAlign: "center" }}>
        Choose file
        <input
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </label>
      <button type="button" style={buttonStyle} onClick={handleMic}>
        Use mic
      </button>
      <button type="button" style={buttonStyle} onClick={handleStop}>
        Stop
      </button>

      <div
        style={{
          borderTop: "1px solid #444",
          paddingTop: 6,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ opacity: 0.7 }}>browser TTS</div>
        <textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          rows={3}
          style={{
            background: "#1a1a1a",
            color: "white",
            border: "1px solid #444",
            borderRadius: 4,
            padding: 4,
            fontFamily: "inherit",
            fontSize: 11,
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1 }}
            onClick={() => tts.speak(ttsText)}
            disabled={tts.speaking}
          >
            {tts.speaking ? "Speaking…" : "Speak"}
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, flex: 1 }}
            onClick={tts.stop}
          >
            Stop TTS
          </button>
        </div>
      </div>

      {error ? <div style={{ color: "#ffb0b0" }}>{error}</div> : null}
    </div>
  );
}
