import api from './client';

export const authApi = {
  register: (name, username, email, password) =>
    api.post('/auth/register', { name, username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  logout: () =>
    api.post('/auth/logout'),
};