import { create } from 'zustand'

export const useUIStore = create((set) => ({
  // View mode for feed page
  viewMode: 'grid', // 'grid' | 'list'
  setViewMode: (mode) => set({ viewMode: mode }),

  // Theme (optional)
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Selected trail node (for graph interaction)
  selectedTrailNodeId: null,
  setSelectedTrailNodeId: (id) => set({ selectedTrailNodeId: id }),

  // Graph explorer tab
  explorerTab: 'list', // 'list' | 'network'
  setExplorerTab: (tab) => set({ explorerTab: tab }),

  // Trail filters
  trailFilters: {
    showOnlyOrigin: false,
    maxHops: 10,
    hideLowImpact: false,
    highlightDebunkers: false
  },
  setTrailFilter: (key, value) => set((state) => ({
    trailFilters: { ...state.trailFilters, [key]: value }
  })),

  // Verification sessions history
  recentVerifications: [],
  addVerification: (session) => set((state) => ({
    recentVerifications: [session, ...state.recentVerifications].slice(0, 10)
  }))
}))

