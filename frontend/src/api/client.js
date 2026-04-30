import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stucare_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url         = error.config?.url || '';
    const isAuthRoute = url.includes('/auth/login')
                     || url.includes('/auth/register')
                     || url.includes('/auth/verify-otp')
                     || url.includes('/auth/resend-otp');

    // 401 — token invalid/expired, send to login
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.clear();
      window.location.href = '/login';
    }

    // 403 — email not verified on a protected route (bypass attempt)
    // Let auth routes handle their own 403s (Login.jsx catches it and redirects properly)
    if (error.response?.status === 403 && !isAuthRoute) {
      const userId = JSON.parse(localStorage.getItem('stucare_user') || '{}')?.id;
      localStorage.clear();
      window.location.href = userId ? `/verify-email?userId=${userId}` : '/register';
    }

    return Promise.reject(error);
  }
);

export default api;