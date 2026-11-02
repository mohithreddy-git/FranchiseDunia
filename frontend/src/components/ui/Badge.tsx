import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'slate' | 'verified' | 'featured' | 'rose' | 'blue';
  size?: 'sm' | 'md';
}

export function Badge({
  variant = 'slate',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-white/[0.05] text-muted border-white/[0.08]',
    verified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-medium',
    featured: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30 font-medium',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-pill border select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {variant === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
      {variant === 'featured' && <Sparkles className="w-3 h-3 text-amber-400" />}
      {children}
    </span>
  );
}
