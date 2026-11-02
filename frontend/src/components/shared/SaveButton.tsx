'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

interface SaveButtonProps {
  targetType: 'franchise' | 'event' | 'business';
  targetId: string;
  initialSaved?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export default function SaveButton({
  targetType,
  targetId,
  initialSaved = false,
  className = '',
  size = 'md',
}: SaveButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/auth/login?returnTo=${encodeURIComponent(pathname || '/dashboard')}`);
      return;
    }

    const previousState = isSaved;
    setIsSaved(!previousState);
    setIsLoading(true);

    try {
      if (previousState) {
        await api.saved.unsave(targetType, targetId);
      } else {
        await api.saved.save(targetType, targetId);
      }
    } catch (err) {
      console.error('Failed to update save status:', err);
      // Revert optimistic state
      setIsSaved(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isSaved ? `Remove ${targetType} from saved` : `Save ${targetType}`}
      className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 group/save ${
        isSaved
          ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
          : 'bg-black/40 text-muted hover:text-white border border-white/[0.1] hover:bg-black/60'
      } ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-150 group-hover/save:scale-110 ${
          isSaved ? 'fill-rose-500 text-rose-500' : 'fill-transparent'
        }`}
      />
    </button>
  );
}
