import { create } from 'zustand';
import { authService, userService } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  verifyOTP: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.verifyOTP(email, otp);
      set({ isLoading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'OTP verification failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ 
      user: null, 
      isAuthenticated: false, 
      error: null 
    });
  },

  loadUser: async () => {
    const isAuth = await authService.isAuthenticated();
    if (isAuth) {
      try {
        const user = await userService.getProfile();
        set({ user, isAuthenticated: true });
      } catch (error) {
        set({ user: null, isAuthenticated: false });
      }
    }
  },

  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
