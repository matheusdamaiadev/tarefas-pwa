import apiClient from './config.js';

const tasksApi = {
  getAll() {
    return apiClient.get('/tasks');
  },

  create(title, priority = 'normal') {
    return apiClient.post('/tasks', { title, priority });
  },

  update(id, data) {
    return apiClient.patch(`/tasks/${id}`, data);
  },

  remove(id) {
    return apiClient.delete(`/tasks/${id}`);
  },
};

export default tasksApi;