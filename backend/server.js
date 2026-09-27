require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: "EV Charging Demand Prediction & Smart Charging Analytics API",
    status: "online",
    endpoints: [
      "/api/health",
      "/api/summary",
      "/api/time-series",
      "/api/clusters",
      "/api/anomalies",
      "/api/model-evaluation",
      "/api/predictions",
      "/api/predict"
    ]
  });
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 EV Charging Node.js Backend listening on port ${PORT}`);
  console.log(`📡 ML Service configured at: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`====================================================`);
});
