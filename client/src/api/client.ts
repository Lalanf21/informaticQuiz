import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001' });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);
