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
      // Store the OTP ID and registration data for verification
      set({ otpId: data.otpId, registrationData: data.registrationData, isLoading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  verifyOTP: async (otp) => {
    set({ isLoading: true, error: null });
    try {
      const { otpId, registrationData } = get();
      const data = await authService.verifyOTP(otpId, otp, registrationData);
      set({ isLoading: false, user: data.user, isAuthenticated: true });
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
      // For now, since user profile endpoint is not implemented,
      // we'll just check if token exists and assume user is authenticated
      // In the future, this should fetch fresh user data from /users/:id
      set({ isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
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
