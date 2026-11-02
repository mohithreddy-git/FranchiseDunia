import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-item bg-white/[0.06]', className)}
      {...props}
    />
  );
}

export function FranchiseCardSkeleton() {
  return (
    <div className="rounded-card bg-surface border border-white/[0.08] p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-item" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="grid grid-cols-2 gap-2 pt-2">
        <Skeleton className="h-10 rounded-item" />
        <Skeleton className="h-10 rounded-item" />
      </div>
      <div className="pt-2 flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-28 rounded-item" />
      </div>
    </div>
  );
}
