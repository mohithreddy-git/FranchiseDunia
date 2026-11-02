'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const { setUser, setLoading, setDemoModeEnabled } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const [meRes, demoRes] = await Promise.allSettled([
          api.auth.getMe(),
          api.auth.getDemoStatus(),
        ]);

        if (!mounted) return;

        if (meRes.status === 'fulfilled' && meRes.value?.user) {
          setUser(meRes.value.user);
        } else {
          setUser(null);
        }

        if (demoRes.status === 'fulfilled' && demoRes.value) {
          setDemoModeEnabled(demoRes.value.demoModeEnabled);
        }
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [setUser, setLoading, setDemoModeEnabled]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
