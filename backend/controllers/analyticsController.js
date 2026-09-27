const dataService = require('../services/dataService');
const mlClientService = require('../services/mlClientService');

class AnalyticsController {
  async getSummary(req, res) {
    try {
      const summary = dataService.getSummary();
      return res.json({ success: true, data: summary });
    } catch (err) {
      console.error('[AnalyticsController] getSummary error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load analytics data.', error: err.message });
    }
  }

  async getTimeSeries(req, res) {
    try {
      const timeSeries = dataService.getTimeSeries();
      return res.json({ success: true, data: timeSeries });
    } catch (err) {
      console.error('[AnalyticsController] getTimeSeries error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load time-series data.', error: err.message });
    }
  }

  async getClusters(req, res) {
    try {
      const clusters = dataService.getClusters();
      return res.json({ success: true, data: clusters });
    } catch (err) {
      console.error('[AnalyticsController] getClusters error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load cluster analytics.', error: err.message });
    }
  }

  async getAnomalies(req, res) {
    try {
      const { page, limit, filter } = req.query;
      const anomalies = dataService.getAnomalies(page, limit, filter);
      return res.json({ success: true, data: anomalies });
    } catch (err) {
      console.error('[AnalyticsController] getAnomalies error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load anomaly detection data.', error: err.message });
    }
  }

  async getModelEvaluation(req, res) {
    try {
      const evaluation = dataService.getModelEvaluation();
      return res.json({ success: true, data: evaluation });
    } catch (err) {
      console.error('[AnalyticsController] getModelEvaluation error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load model evaluation metrics.', error: err.message });
    }
  }

  async getPredictions(req, res) {
    try {
      const { page, limit, search, sortField, sortOrder } = req.query;
      const predictions = dataService.getPredictions(page, limit, search, sortField, sortOrder);
      return res.json({ success: true, data: predictions });
    } catch (err) {
      console.error('[AnalyticsController] getPredictions error:', err.message);
      return res.status(500).json({ success: false, message: 'Unable to load prediction results.', error: err.message });
    }
  }

  async predictDemand(req, res) {
    try {
      const inputData = req.body;
      if (!inputData || typeof inputData !== 'object') {
        return res.status(400).json({ success: false, message: 'Invalid prediction input payload.' });
      }

      const predictionResult = await mlClientService.predict(inputData);
      return res.json({ success: true, data: predictionResult });
    } catch (err) {
      console.error('[AnalyticsController] predictDemand error:', err.message);
      return res.status(503).json({
        success: false,
        message: err.message || 'Prediction service is currently unavailable. Please start the ML service and try again.'
      });
    }
  }

  async getHealth(req, res) {
    const mlHealth = await mlClientService.checkHealth();
    return res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      services: {
        backend: 'healthy',
        mlService: mlHealth.online ? 'healthy' : 'offline'
      }
    });
  }
}

module.exports = new AnalyticsController();
