import { useEffect } from "react";
import { useValue, type SkiaMutableValue } from "@shopify/react-native-skia";

const TWO_PI = Math.PI * 2;

export function useBreath(speedHz: number): { phase: SkiaMutableValue<number> } {
  const phase = useValue(0);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      let next = phase.current + TWO_PI * speedHz * dt;
      if (next > TWO_PI) next -= TWO_PI;
      phase.current = next;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedHz, phase]);

  return { phase };
}
