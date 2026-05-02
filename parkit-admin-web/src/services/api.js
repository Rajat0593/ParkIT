import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAuthService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

export const adminUserService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  verifyKYC: async (id, status) => {
    const response = await api.post(`/users/${id}/kyc`, { status });
    return response.data;
  },
};

export const adminSpaceService = {
  getAll: async () => {
    const response = await api.get('/spaces');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/spaces/${id}`);
    return response.data;
  },

  verify: async (id, status) => {
    const response = await api.post(`/spaces/${id}/verify`, { status });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/spaces/${id}`);
    return response.data;
  },
};

export const adminBookingService = {
  getAll: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};

export const adminDashboardService = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAnalytics: async (period = '30d') => {
    const response = await api.get(`/admin/analytics?period=${period}`);
    return response.data;
  },
};

export default api;
