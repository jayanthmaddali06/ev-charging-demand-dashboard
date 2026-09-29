import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Centralized error interceptor
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    let msg = 'Unable to connect to the server.';

    if (
      error.response &&
      error.response.data &&
      error.response.data.message
    ) {
      msg = error.response.data.message;
    } else if (error.message) {
      msg = error.message;
    }

    return Promise.reject(new Error(msg));
  }
);

export const api = {
  // Existing APIs
  getSummary: () => apiClient.get('/summary'),

  getTimeSeries: () => apiClient.get('/time-series'),

  getClusters: () => apiClient.get('/clusters'),

  getAnomalies: (params = {}) =>
    apiClient.get('/anomalies', { params }),

  getModelEvaluation: () =>
    apiClient.get('/model-evaluation'),

  getPredictions: (params = {}) =>
    apiClient.get('/predictions', { params }),

  predictDemand: (payload) =>
    apiClient.post('/predict', payload),

  getHealth: () =>
    apiClient.get('/health'),

  // AI Intelligence APIs
  getAiHealth: () =>
    apiClient.get('/ai/health'),

  sendAiChat: (payload) =>
    apiClient.post('/ai/chat', payload)
};

export default api;