import api from './client';

export const authApi = {
  register:  (name, username, email, password) =>
    api.post('/auth/register', { name, username, email, password }),
  verifyOTP: (userId, otp) =>
    api.post('/auth/verify-otp', { userId, otp }),
  resendOTP: (userId) =>
    api.post('/auth/resend-otp', { userId }),
  login:     (username, password) =>
    api.post('/auth/login', { username, password }),
  logout:    () =>
    api.post('/auth/logout'),
};