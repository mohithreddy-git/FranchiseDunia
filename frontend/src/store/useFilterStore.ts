import { create } from 'zustand';

interface FilterState {
  isMobileFilterOpen: boolean;
  openMobileFilter: () => void;
  closeMobileFilter: () => void;
  toggleMobileFilter: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  isMobileFilterOpen: false,
  openMobileFilter: () => set({ isMobileFilterOpen: true }),
  closeMobileFilter: () => set({ isMobileFilterOpen: false }),
  toggleMobileFilter: () => set((state) => ({ isMobileFilterOpen: !state.isMobileFilterOpen })),
}));
