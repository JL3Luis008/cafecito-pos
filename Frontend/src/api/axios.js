import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — Sprint 4 agregará el JWT aquí
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normaliza mensajes de error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Error de conexión con el servidor';

    error.displayMessage = message;
    return Promise.reject(error);
  }
);

export default api;
