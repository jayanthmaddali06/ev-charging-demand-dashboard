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
    apiClient.post('/ai/chat', payload),

  // Live Intelligence APIs
  getLiveIntelligenceAnalysis: (latitude, longitude, stations = null) => {
    if (stations && Array.isArray(stations) && stations.length > 0) {
      return apiClient.post('/live-intelligence/analyze', { latitude, longitude, stations });
    }
    return apiClient.get('/live-intelligence/analyze', { params: { latitude, longitude } });
  },

  getNearbyStations: (latitude, longitude, stations = null) => {
    if (stations && Array.isArray(stations) && stations.length > 0) {
      return apiClient.post('/live-intelligence/nearby-stations', { latitude, longitude, stations });
    }
    return apiClient.get('/live-intelligence/nearby-stations', { params: { latitude, longitude } });
  },

  getLiveRecommendations: (latitude, longitude, stations = null) => {
    if (stations && Array.isArray(stations) && stations.length > 0) {
      return apiClient.post('/live-intelligence/recommendations', { latitude, longitude, stations });
    }
    return apiClient.get('/live-intelligence/recommendations', { params: { latitude, longitude } });
  },

  getProposedNewStation: (latitude, longitude, stations = null) => {
    if (stations && Array.isArray(stations) && stations.length > 0) {
      return apiClient.post('/live-intelligence/new-station', { latitude, longitude, stations });
    }
    return apiClient.get('/live-intelligence/new-station', { params: { latitude, longitude } });
  }
};

export default api;