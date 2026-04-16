import api from './client';

export const analyticsApi = {
  getProgress: () => api.get('/analytics/progress'),
  getStreak:   () => api.get('/analytics/streak'),
};