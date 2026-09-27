const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// System Health
router.get('/health', (req, res) => analyticsController.getHealth(req, res));

// Overview & KPI Summary
router.get('/summary', (req, res) => analyticsController.getSummary(req, res));

// Time-Series Analytics
router.get('/time-series', (req, res) => analyticsController.getTimeSeries(req, res));

// K-Means Cluster Analysis
router.get('/clusters', (req, res) => analyticsController.getClusters(req, res));

// Anomaly Detection Analysis
router.get('/anomalies', (req, res) => analyticsController.getAnomalies(req, res));

// Model Performance & Evaluation
router.get('/model-evaluation', (req, res) => analyticsController.getModelEvaluation(req, res));

// Test Predictions & Actuals
router.get('/predictions', (req, res) => analyticsController.getPredictions(req, res));

// Real-Time ML Inference
router.post('/predict', (req, res) => analyticsController.predictDemand(req, res));

module.exports = router;
