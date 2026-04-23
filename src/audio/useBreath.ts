import { useEffect, useState } from "react";

const TWO_PI = Math.PI * 2;

export function useBreath(speedHz: number): {
  phase: number;
  elapsedMs: number;
} {
  const [state, setState] = useState({ phase: 0, elapsedMs: 0 });

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let last = start;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setState((prev) => {
        let next = prev.phase + TWO_PI * speedHz * dt;
        if (next > TWO_PI) next -= TWO_PI;
        return { phase: next, elapsedMs: now - start };
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speedHz]);

  return state;
}
