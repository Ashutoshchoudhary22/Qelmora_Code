import axios from 'axios';

const TOKEN_KEY = 'qelmora_token';
const USER_KEY = 'qelmora_user';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1', timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || '');
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('qelmora:session-expired'));
    }
    return Promise.reject(error);
  }
);
