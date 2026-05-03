import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.accessToken) {
      await SecureStore.setItemAsync('accessToken', response.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  verifyOTP: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  isAuthenticated: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    return !!token;
  },
};

export const spaceService = {
  getAll: async (filters = {}) => {
    const response = await api.get('/spaces', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/spaces/${id}/details`);
    return response.data;
  },

  getNearby: async (params) => {
    const response = await api.get('/spaces/search/nearby', { params });
    return response.data;
  },

  searchByDestination: async (params) => {
    const response = await api.get('/spaces/search/destination', { params });
    return response.data;
  },

  getTrending: async (params = {}) => {
    const response = await api.get('/spaces/trending', { params });
    return response.data;
  },

  search: async (query, filters = {}) => {
    const response = await api.get('/spaces/search', {
      params: { q: query, ...filters },
    });
    return response.data;
  },

  create: async (spaceData) => {
    const response = await api.post('/spaces', spaceData);
    return response.data;
  },

  update: async (id, spaceData) => {
    const response = await api.put(`/spaces/${id}`, spaceData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/spaces/${id}`);
    return response.data;
  },
};

export const bookingService = {
  getAll: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  create: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  update: async (id, bookingData) => {
    const response = await api.put(`/bookings/${id}`, bookingData);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};

export const vehicleService = {
  getAll: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  create: async (vehicleData) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },

  update: async (id, vehicleData) => {
    const response = await api.put(`/vehicles/${id}`, vehicleData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  getBookings: async () => {
    const response = await api.get('/users/bookings');
    return response.data;
  },

  getReviews: async () => {
    const response = await api.get('/users/reviews');
    return response.data;
  },
};

export default api;
