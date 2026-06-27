import api from './client';

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  approve: (id) => api.patch(`/users/${id}/approve`),
  reject: (id) => api.patch(`/users/${id}/reject`),
  suspend: (id) => api.patch(`/users/${id}/suspend`),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
};
