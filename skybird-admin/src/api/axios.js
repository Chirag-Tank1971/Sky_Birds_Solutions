import axios from 'axios';

// Production builds fall back to the live API, like the user site does.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://course-api-sp35.onrender.com/api' : 'http://localhost:5000/api');

// Origin of the API server, for files it serves outside /api (e.g. /uploads/...).
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

// Absolute URL for a stored image path; full URLs and data URIs are returned unchanged.
export const assetUrl = (value) =>
  !value || /^(https?:|data:)/i.test(value) ? value : `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
