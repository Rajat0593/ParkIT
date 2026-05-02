import { create } from 'zustand';

const useLocationStore = create((set, get) => ({
  // User Location
  userLocation: {
    latitude: null,
    longitude: null,
    accuracy: null,
    lastUpdated: null,
  },

  // Search State
  searchMode: 'current_location', // 'current_location' or 'destination'
  selectedDestination: null,
  searchFilters: {
    radius_km: 5,
    vehicle_type: 'all',
    sort_by: 'distance',
  },

  // Results
  nearbySpaces: [],
  isLoading: false,
  error: null,

  // Cache
  searchCache: {},
  cacheExpiry: {},

  // Actions
  setUserLocation: (location) =>
    set({
      userLocation: {
        ...location,
        lastUpdated: new Date(),
      },
    }),

  setSearchMode: (mode) => set({ searchMode: mode }),

  setSelectedDestination: (destination) =>
    set({ selectedDestination: destination }),

  setSearchFilters: (filters) =>
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    })),

  setNearbySpaces: (spaces) => set({ nearbySpaces: spaces }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  // Caching utilities
  setCachedSearch: (key, data) =>
    set((state) => ({
      searchCache: { ...state.searchCache, [key]: data },
      cacheExpiry: {
        ...state.cacheExpiry,
        [key]: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
      },
    })),

  getCachedSearch: (key) => {
    const state = get();
    const expiry = state.cacheExpiry[key];

    if (!expiry || Date.now() > expiry) {
      // Cache expired or not found
      set((s) => ({
        searchCache: { ...s.searchCache, [key]: null },
      }));
      return null;
    }

    return state.searchCache[key];
  },

  clearCache: () =>
    set({
      searchCache: {},
      cacheExpiry: {},
    }),

  // Check if should search based on location change
  shouldSearch: (newLat, newLng) => {
    const state = get();
    const { userLocation } = state;

    if (!userLocation.latitude) return true; // First search

    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = ((newLat - userLocation.latitude) * Math.PI) / 180;
    const dLng = ((newLng - userLocation.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.latitude * Math.PI) / 180) *
        Math.cos((newLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance > 0.5; // Search if moved more than 500m
  },

  resetSearch: () =>
    set({
      nearbySpaces: [],
      selectedDestination: null,
      error: null,
      searchMode: 'current_location',
    }),
}));

export default useLocationStore;
