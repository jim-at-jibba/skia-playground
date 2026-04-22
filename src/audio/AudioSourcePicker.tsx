import { useRef, useState } from "react";
import type { AudioSource } from "./useAudioSignal";

type Props = {
  source: AudioSource;
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
};

const buttonStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "#333",
  color: "white",
  border: "1px solid #555",
  borderRadius: 4,
  cursor: "pointer",
};

export function AudioSourcePicker({ source, onChange }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={containerStyle}>
      <div style={{ opacity: 0.7 }}>{sourceLabel}</div>
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
      {error ? (
        <div style={{ color: "#ffb0b0" }}>{error}</div>
      ) : null}
    </div>
  );
}
