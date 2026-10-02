"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeToMotionPreference = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, () => false);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    let start = 0;
    const animate = (time: number) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / 900, 1);
      setCount(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion]);

  return <><span aria-hidden="true">{reducedMotion ? value : count}</span><span className="sr-only">{value}</span></>;
}
