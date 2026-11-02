'use client';

import React from 'react';

export default function AnimatedGridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10">
      {/* Background Gradients */}
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/15 via-emerald-600/5 to-transparent blur-[140px] rounded-full" />
      <div className="absolute top-[20%] right-[-100px] w-[500px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full" />
      <div className="absolute top-[60%] left-[-150px] w-[600px] h-[600px] bg-emerald-500/10 blur-[150px] rounded-full" />

      {/* SVG Grid Overlay */}
      <svg
        className="absolute inset-0 w-full h-full stroke-white/[0.04] [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
            patternTransform="translate(0 0)"
          >
            <path d="M.5 60V.5H60" fill="none" strokeWidth="1" strokeDasharray="3 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth="0" fill="url(#grid-pattern)" />
      </svg>
    </div>
  );
}
