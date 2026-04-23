import { useEffect, useRef, useState } from "react";

const BASE_SPEAKING_LEVEL = 0.4;
const BOUNDARY_PULSE_LEVEL = 0.85;
const ATTACK = 0.35;
const PULSE_DECAY = 0.9;
const SILENCE_DECAY = 0.85;
const LEVEL_EPSILON = 0.005;

type TtsApi = {
  speak: (text: string) => void;
  stop: () => void;
  level: number;
  speaking: boolean;
};

export function useTts(): TtsApi {
  const [level, setLevelState] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  const currentRef = useRef(0);
  const targetRef = useRef(0);
  const speakingRef = useRef(false);
  const rafRef = useRef(0);
  const lastPushedRef = useRef(0);

  const ensureLoop = () => {
    if (rafRef.current) return;
    const tick = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const next = cur + (tgt - cur) * ATTACK;
      currentRef.current = next;

      if (speakingRef.current) {
        if (targetRef.current > BASE_SPEAKING_LEVEL) {
          targetRef.current =
            BASE_SPEAKING_LEVEL +
            (targetRef.current - BASE_SPEAKING_LEVEL) * PULSE_DECAY;
        } else {
          targetRef.current = BASE_SPEAKING_LEVEL;
        }
      } else {
        targetRef.current *= SILENCE_DECAY;
      }

      if (Math.abs(next - lastPushedRef.current) > LEVEL_EPSILON) {
        lastPushedRef.current = next;
        setLevelState(next);
      }

      if (speakingRef.current || next > LEVEL_EPSILON) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = 0;
        if (next !== 0) {
          currentRef.current = 0;
          lastPushedRef.current = 0;
          setLevelState(0);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    speakingRef.current = false;
    targetRef.current = 0;
    setSpeaking(false);
    ensureLoop();
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    if (!text.trim()) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.onstart = () => {
      speakingRef.current = true;
      targetRef.current = BASE_SPEAKING_LEVEL;
      setSpeaking(true);
      ensureLoop();
    };
    utter.onboundary = (e) => {
      if (e.name === "word") {
        targetRef.current = BOUNDARY_PULSE_LEVEL;
      }
    };
    utter.onend = () => {
      speakingRef.current = false;
      targetRef.current = 0;
      setSpeaking(false);
    };
    utter.onerror = () => {
      speakingRef.current = false;
      targetRef.current = 0;
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utter);
  };

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  return { speak, stop, level, speaking };
}
