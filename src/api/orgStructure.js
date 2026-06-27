import api from './client';

export const campusApi = {
  list: () => api.get('/campuses'),
  listPublic: () => api.get('/campuses/public'),
  get: (id) => api.get(`/campuses/${id}`),
  create: (payload) => api.post('/campuses', payload),
  update: (id, payload) => api.put(`/campuses/${id}`, payload),
  remove: (id) => api.delete(`/campuses/${id}`),
};

export const collegeApi = {
  list: (params) => api.get('/colleges', { params }),
  listPublic: (params) => api.get('/colleges/public', { params }),
  get: (id) => api.get(`/colleges/${id}`),
  create: (payload) => api.post('/colleges', payload),
  update: (id, payload) => api.put(`/colleges/${id}`, payload),
  remove: (id) => api.delete(`/colleges/${id}`),
};

export const departmentApi = {
  list: (params) => api.get('/departments', { params }),
  listPublic: (params) => api.get('/departments/public', { params }),
  get: (id) => api.get(`/departments/${id}`),
  create: (payload) => api.post('/departments', payload),
  update: (id, payload) => api.put(`/departments/${id}`, payload),
  remove: (id) => api.delete(`/departments/${id}`),
};
