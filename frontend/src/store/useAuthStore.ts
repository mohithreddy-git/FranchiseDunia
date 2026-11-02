import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  demoModeEnabled: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setDemoModeEnabled: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  demoModeEnabled: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setDemoModeEnabled: (demoModeEnabled) => set({ demoModeEnabled }),
}));
