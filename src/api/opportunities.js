import api from './client';

export const researchApi = {
  list: (params) => api.get('/research', { params }),
  get: (id) => api.get(`/research/${id}`),
  create: (payload) => api.post('/research', payload),
  update: (id, payload) => api.put(`/research/${id}`, payload),
  review: (id, payload) => api.patch(`/research/${id}/review`, payload),
  remove: (id) => api.delete(`/research/${id}`),
};

export const internshipApi = {
  list: (params) => api.get('/internships', { params }),
  get: (id) => api.get(`/internships/${id}`),
  create: (payload) => api.post('/internships', payload),
  update: (id, payload) => api.put(`/internships/${id}`, payload),
  review: (id, payload) => api.patch(`/internships/${id}/review`, payload),
  remove: (id) => api.delete(`/internships/${id}`),
};
