const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();


const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const liveIntelligenceRoutes = require('./routes/liveIntelligenceRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ──────────────────────────────────────────────────────────────────────────────
// MongoDB Connection
// ──────────────────────────────────────────────────────────────────────────────
if (!process.env.MONGODB_URI) {
  console.error('[DB] FATAL: MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('[DB] MongoDB connected successfully.'))
  .catch((err) => {
    console.error('[DB] MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ──────────────────────────────────────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' })); // Support Google Places station payloads
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────

// Authentication routes (public)
app.use('/api/auth', authRoutes);
app.use('/api/live-intelligence', liveIntelligenceRoutes);
app.use('/api', apiRoutes);
// Analytics / ML API routes (public analytics; prediction is unguarded for now
// since the ML service itself has no user-specific data)
app.use('/api/ai', aiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'EV Charging Demand Prediction & Smart Charging Analytics API',
    status: 'online',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/health',
      '/api/summary',
      '/api/time-series',
      '/api/clusters',
      '/api/anomalies',
      '/api/model-evaluation',
      '/api/predictions',
      '/api/predict',
    ]
  });
});

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.type || err.name, err.message, err.stack);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request payload too large. Please reduce batch size.'
    });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Start
// ──────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 EV Charging Node.js Backend listening on port ${PORT}`);
  console.log(`📡 ML Service configured at: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI loaded' : 'NOT SET'}`);
  console.log(`====================================================`);
});
