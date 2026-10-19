"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeToMotionPreference = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(value);
  const element = useRef<HTMLSpanElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, () => false);

  useEffect(() => {
    if (reducedMotion || !element.current) return;

    let frame = 0;
    let start = 0;
    const animate = (time: number) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / 300, 1);
      setCount(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.5 });
    observer.observe(element.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, reducedMotion]);

  return <><span ref={element} className="stat-counter" aria-hidden="true">{reducedMotion ? value : count}</span><span className="sr-only">{value}</span></>;
}
