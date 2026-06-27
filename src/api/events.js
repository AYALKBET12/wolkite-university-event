import api from './client';

export const eventApi = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
  create: (payload) => api.post('/events', payload),
  update: (id, payload) => api.put(`/events/${id}`, payload),
  remove: (id) => api.delete(`/events/${id}`),
};
