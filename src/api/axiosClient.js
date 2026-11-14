import axios from 'axios';
import {
  clearAuthStorage,
  SESSION_EXPIRED_EVENT,
  STORAGE_TOKEN_KEY,
} from '../utils/authStorage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de petición: adjunta automáticamente el token JWT si existe
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo centralizado de sesiones expiradas (401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthStorage();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;