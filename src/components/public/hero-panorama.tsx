"use client";

import type { ReactNode } from 'react';

export function HeroPanorama({ children }: { children: ReactNode }) {
  return (
    <figure
      className="hero-panorama"
      onPointerMove={(event) => {
        if (!window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--spot-x', `${event.clientX - bounds.left}px`);
        event.currentTarget.style.setProperty('--spot-y', `${event.clientY - bounds.top}px`);
      }}
    >
      {children}
    </figure>
  );
}
