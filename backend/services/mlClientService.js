const axios = require('axios');

class MlClientService {
  constructor() {
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Health check to ML service
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 3000 });
      return { online: true, data: response.data };
    } catch (err) {
      return { online: false, error: err.message };
    }
  }

  /**
   * Forward prediction request to FastAPI ML service
   */
  async predict(inputData) {
    try {
      const response = await axios.post(`${this.baseUrl}/predict`, inputData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return response.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        throw new Error('Prediction service is currently unavailable. Please start the ML service and try again.');
      }
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(`ML Service Error: ${JSON.stringify(err.response.data.detail)}`);
      }
      throw new Error(err.message || 'An error occurred during prediction.');
    }
  }
}

module.exports = new MlClientService();
