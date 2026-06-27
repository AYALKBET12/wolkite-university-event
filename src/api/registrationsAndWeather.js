import api from './client';

export const registrationApi = {
  myRegistrations: () => api.get('/registrations', { params: { mine: true } }),
  forEvent: (eventId) => api.get('/registrations', { params: { eventId } }),
  register: (eventId, notes) => api.post('/registrations', { eventId, notes }),
  cancel: (id) => api.patch(`/registrations/${id}/cancel`),
  markAttended: (id) => api.patch(`/registrations/${id}/attend`),
  remove: (id) => api.delete(`/registrations/${id}`),
};

export const weatherApi = {
  getForCampus: (campusId, force = false) =>
    api.get(`/weather/${campusId}`, { params: force ? { force: true } : {} }),
  history: (campusId, limit) => api.get(`/weather/${campusId}/history`, { params: { limit } }),
};
