const axios = require('axios');

class MlClientService {
  constructor() {
    // Determine runtime environment
    this.isProduction =
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.RENDER) ||
      Boolean(process.env.RENDER_SERVICE_ID);

    // Primary ML service URL
    if (process.env.ML_SERVICE_URL) {
      this.baseUrl = process.env.ML_SERVICE_URL.replace(/\/+$/, '');
    } else if (this.isProduction) {
      // In production/Render, must be explicitly provided
      this.baseUrl = '';
    } else {
      // In local development default
      this.baseUrl = 'http://localhost:8000';
    }
  }

  /**
   * Helper sleep for exponential backoff
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check to ML service with retries for Render cold starts
   */
  async checkHealth(retries = 3) {
    if (!this.baseUrl) {
      return { online: false, warmingUp: false, error: 'ML_SERVICE_URL is not configured.' };
    }

    const delays = [2000, 4000, 8000];
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 6000 });
        return {
          online: true,
          warmingUp: false,
          data: response.data,
          attempt: attempt + 1
        };
      } catch (err) {
        if (attempt < retries - 1) {
          const waitTime = delays[attempt] || 4000;
          await this.sleep(waitTime);
        } else {
          return {
            online: false,
            warmingUp: false,
            error: err.message,
            attempts: retries
          };
        }
      }
    }
  }

  /**
   * Forward prediction request to FastAPI ML service
   */
  async predict(inputData) {
    if (!this.baseUrl) {
      throw new Error('ML Service is not configured. Please verify ML_SERVICE_URL.');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/predict`, inputData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000
      });
      return response.data;
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
        throw new Error('ML Prediction service is currently unavailable. Please ensure the ML service is online.');
      }
      if (err.response && err.response.data && err.response.data.detail) {
        throw new Error(`ML Service Error: ${JSON.stringify(err.response.data.detail)}`);
      }
      throw new Error(err.message || 'An error occurred during prediction.');
    }
  }

  /**
   * Forward live demand prediction with strict environment-aware handling
   */
  async predictLiveDemand(inputData) {
    // 1. Production / Render mode: MUST use ML_SERVICE_URL only. Never attempt localhost:8000.
    if (this.isProduction) {
      if (!this.baseUrl) {
        return {
          success: false,
          error: 'ML_SERVICE_URL environment variable is not configured.',
          data: null
        };
      }

      try {
        const response = await axios.post(`${this.baseUrl}/predict/live-demand`, inputData, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
        return { success: true, data: response.data };
      } catch (err) {
        const errMsg = err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : err.message || 'Render ML service is unavailable.';
        return {
          success: false,
          error: `ML Service Error: ${errMsg}`,
          data: null
        };
      }
    }

    // 2. Local development mode:
    const sanitizedUrl = this.baseUrl.replace(/:[^:@]+@/, ':***@');
    console.log(`[ML Client] Requesting live-demand from: ${sanitizedUrl}/predict/live-demand`);
    console.log(`[ML Client] Payload summary: hour=${inputData.hour}, day=${inputData.day_of_week}, location=${inputData.location_type}`);

    // First try configured baseUrl (which could be Render URL or http://localhost:8000)
    try {
      const response = await axios.post(`${this.baseUrl}/predict/live-demand`, inputData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 6000
      });
      console.log(`[ML Client] Response status: ${response.status} OK`);
      return { success: true, data: response.data };
    } catch (primaryErr) {
      console.warn(`[ML Client] Primary URL failed with status: ${primaryErr.response?.status || 'Network Error'} (${primaryErr.message})`);

      // In local development, if configured URL failed and it wasn't localhost:8000,
      // check if a local ML service is actually running on port 8000
      if (!this.baseUrl.includes('localhost') && !this.baseUrl.includes('127.0.0.1')) {
        try {
          console.log(`[ML Client] Development fallback: attempting local ML service at http://localhost:8000/predict/live-demand`);
          const localResponse = await axios.post('http://localhost:8000/predict/live-demand', inputData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 3000
          });
          console.log(`[ML Client] Local ML service responded with status: ${localResponse.status} OK`);
          return { success: true, data: localResponse.data };
        } catch (localErr) {
          console.warn(`[ML Client] Local fallback also failed with status: ${localErr.response?.status || 'Network Error'} (${localErr.message})`);
        }
      }

      // Return clear error without fabricating predictions
      return {
        success: false,
        error: `ML Prediction Service unavailable: ${primaryErr.message}`,
        data: null
      };
    }
  }
}

function round(val, dec = 2) {
  return Number(Number(val).toFixed(dec));
}

module.exports = new MlClientService();
