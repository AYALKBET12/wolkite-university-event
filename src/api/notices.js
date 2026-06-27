import api from './client';

export const noticeApi = {
  list: (params) => api.get('/notices', { params }),
  get: (id) => api.get(`/notices/${id}`),
  create: (payload) => api.post('/notices', payload),
  update: (id, payload) => api.put(`/notices/${id}`, payload),
  remove: (id) => api.delete(`/notices/${id}`),
};
