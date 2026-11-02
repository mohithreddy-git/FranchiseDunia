'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BorderGlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'emerald' | 'amber';
}

export default function BorderGlowCard({
  children,
  className,
  glowColor = 'emerald',
  ...props
}: BorderGlowCardProps) {
  const glowClasses =
    glowColor === 'emerald'
      ? 'group-hover:border-emerald-500/40 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]'
      : 'group-hover:border-amber-500/40 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]';

  return (
    <div
      className={cn(
        'group relative rounded-card bg-surface border border-white/[0.08] p-6 transition-all duration-300',
        glowClasses,
        className
      )}
      {...props}
    >
      {/* Subtle corner light flare */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.03] to-transparent rounded-tr-card pointer-events-none" />
      {children}
    </div>
  );
}
