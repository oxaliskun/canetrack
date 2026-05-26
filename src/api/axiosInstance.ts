import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('canetrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !['/login', '/'].includes(window.location.pathname)) {
      localStorage.removeItem('canetrack_token');
      localStorage.removeItem('canetrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
