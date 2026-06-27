import api from './client';

export const scheduleApi = {
  list: (params) => api.get('/schedules', { params }),
  get: (id) => api.get(`/schedules/${id}`),
  create: (payload) => api.post('/schedules', payload),
  update: (id, payload) => api.put(`/schedules/${id}`, payload),
  remove: (id) => api.delete(`/schedules/${id}`),
};

export const examApi = {
  list: (params) => api.get('/exams', { params }),
  get: (id) => api.get(`/exams/${id}`),
  create: (payload) => api.post('/exams', payload),
  update: (id, payload) => api.put(`/exams/${id}`, payload),
  remove: (id) => api.delete(`/exams/${id}`),
};
