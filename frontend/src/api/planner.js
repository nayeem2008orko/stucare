import api from './client';

export const plannerApi = {
  getDailyPlan: (availableHours = 4) =>
    api.get(`/planner/daily?available_hours=${availableHours}`),
  getTasks: () =>
    api.get('/planner/tasks'),
  createTask: (task) =>
    api.post('/planner/tasks', task),
  updateTask: (id, fields) =>
    api.put(`/planner/tasks/${id}`, fields),
  deleteTask: (id) =>
    api.delete(`/planner/tasks/${id}`),
  reschedule: () =>
    api.post('/planner/reschedule', {}),
};