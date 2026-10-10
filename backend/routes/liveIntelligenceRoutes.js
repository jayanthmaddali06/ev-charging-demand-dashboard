const express = require('express');
const {
  calculateDistanceKm,
  normalizeGooglePlace,
  deduplicateStations,
  searchGooglePlacesNearby
} = require('../services/googlePlacesService');
const { analyzeChargingGap } = require('../services/chargingGapService');
const { rankStations } = require('../services/recommendationService');
const mlClientService = require('../services/mlClientService');
const dataService = require('../services/dataService');

const router = express.Router();

/**
 * Helper to determine temporal context based on current time
 */
function getTemporalContext(date = new Date()) {
  const hour = date.getHours();
  const dayOfWeekNum = date.getDay(); // 0 is Sunday, 1 is Monday
  // Convert to Python 0-6 where 0 is Monday, 6 is Sunday
  const pyDayOfWeek = (dayOfWeekNum + 6) % 7;
  const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6 ? 1 : 0;
  const isPeakHour = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 21) ? 1 : 0;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dayOfWeekNum];

  return {
    hour,
    day_of_week: dayName,
    day_of_week_num: pyDayOfWeek,
    is_weekend: isWeekend,
    is_peak_hour: isPeakHour,
    period: isPeakHour ? 'Peak' : 'Off-Peak',
    day_type: isWeekend ? 'Weekend' : 'Weekday',
    timestamp: date.toISOString(),
    displayTime: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

/**
 * Normalizes an array of incoming stations (from Google Places or body)
 */
function processStations(rawStations, latitude, longitude) {
  if (!Array.isArray(rawStations)) return [];

  const normalized = rawStations
    .map((s) => normalizeGooglePlace(s, latitude, longitude))
    .filter((s) => s && s.distanceKm !== null && s.distanceKm <= 15.0);

  const deduped = deduplicateStations(normalized);
  deduped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  return deduped;
}

/**
 * 1. GET & POST /api/live-intelligence/nearby-stations
 */
const handleNearbyStations = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude ?? req.query?.latitude);
    const longitude = Number(req.body?.longitude ?? req.query?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required'
      });
    }

    let stations = [];
    const clientStations = req.body?.stations || (req.query?.stations ? JSON.parse(req.query.stations) : null);

    if (Array.isArray(clientStations)) {
      stations = processStations(clientStations, latitude, longitude);
    } else {
      stations = await searchGooglePlacesNearby({ latitude, longitude, radiusKm: 15.0 });
    }

    const mlSummary = dataService.getSummary();
    const mlPredictions = dataService.getPredictions(1, 100);

    const analysis = analyzeChargingGap(
      stations,
      mlSummary,
      mlPredictions,
      { latitude, longitude }
    );

    return res.json({
      success: true,
      source: 'Google Places',
      count: stations.length,
      stations,
      analysis
    });
  } catch (error) {
    console.error('[LiveIntelligence] Nearby stations lookup failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve nearby charging stations'
    });
  }
};

router.get('/nearby-stations', handleNearbyStations);
router.post('/nearby-stations', handleNearbyStations);

/**
 * 2. GET & POST /api/live-intelligence/analyze (Comprehensive Live Intelligence Analysis)
 */
const handleAnalyze = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude ?? req.query?.latitude);
    const longitude = Number(req.body?.longitude ?? req.query?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required'
      });
    }

    // Step 1: Temporal analysis
    const temporalContext = getTemporalContext();

    // Step 2: Extract & normalize stations strictly within 15 km
    let stations = [];
    const clientStations = req.body?.stations || (req.query?.stations ? (typeof req.query.stations === 'string' ? JSON.parse(req.query.stations) : req.query.stations) : null);

    if (Array.isArray(clientStations)) {
      stations = processStations(clientStations, latitude, longitude);
    } else {
      stations = await searchGooglePlacesNearby({ latitude, longitude, radiusKm: 15.0 });
    }

    // Step 3: ML Demand prediction for the current session & area
    const mlDemandResult = await mlClientService.predictLiveDemand({
      hour: temporalContext.hour,
      day_of_week: temporalContext.day_of_week,
      day_of_week_num: temporalContext.day_of_week_num,
      is_weekend: temporalContext.is_weekend,
      is_peak_hour: temporalContext.is_peak_hour,
      location_type: 'Urban',
      station_load: 54.2,
      connector_count: 4,
      charging_power_kW: 50.0
    });

    // Step 4: Separate 4 nearest stations and other nearby stations
    const nearestFour = stations.slice(0, 4);
    const otherNearby = stations.slice(4);

    // Step 5: Recommendation ranking (for optimal dispatch)
    const rankedStations = rankStations(stations);
    const recommendations = rankedStations.slice(0, 2);

    // Step 6: Charging gap spatial analysis for proposed new station
    const mlSummary = dataService.getSummary();
    const mlPredictions = dataService.getPredictions(1, 100);
    const gapAnalysis = analyzeChargingGap(
      stations,
      mlSummary,
      mlPredictions,
      { latitude, longitude }
    );

    // Step 7: Standardized response with verified data provenance
    const demandSummary = mlDemandResult.success && mlDemandResult.data
      ? {
          available: true,
          predictedDemandKwh: mlDemandResult.data.predicted_demand,
          demandLevel: mlDemandResult.data.demand_level || 'MEDIUM',
          unit: mlDemandResult.data.unit || 'kWh',
          confidence: mlDemandResult.data.confidence || 0.94,
          period: temporalContext.period,
          dayType: temporalContext.day_type,
          modelSource: mlDemandResult.data.model_version || 'Random Forest Regressor Pipeline'
        }
      : {
          available: false,
          error: mlDemandResult.error || 'ML Prediction service is currently unavailable.',
          period: temporalContext.period,
          dayType: temporalContext.day_type
        };

    console.log(`[LiveIntelligence] /analyze request received for (${latitude}, ${longitude}) with ${stations.length} stations`);

    return res.json({
      success: true,
      userLocation: {
        latitude,
        longitude
      },
      temporalContext,
      stations,
      nearestFour,
      otherNearby,
      recommendations,
      proposedStation: gapAnalysis?.candidateArea || null,
      gapAnalysis,
      demandSummary,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSources: [
          'Google Places (Stations Discovery)',
          'FastAPI Random Forest ML Model (Demand Prediction)',
          'Haversine Spatial Geometry (Distance Engine)',
          'Google Maps Platform (Routing & Visual Mapping)'
        ],
        liveDataAvailable: stations.length > 0,
        modelDataAvailable: Boolean(mlDemandResult.success && mlDemandResult.data)
      }
    });
  } catch (error) {
    console.error('[LiveIntelligence] Analysis failed in /analyze route:');
    console.error(' - Error message:', error.message);
    console.error(' - Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to perform Live Intelligence analysis'
    });
  }
};

router.get('/analyze', handleAnalyze);
router.post('/analyze', handleAnalyze);

/**
 * 3. GET & POST /api/live-intelligence/recommendations
 */
const handleRecommendations = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude ?? req.query?.latitude);
    const longitude = Number(req.body?.longitude ?? req.query?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    let stations = [];
    const clientStations = req.body?.stations || null;
    if (Array.isArray(clientStations)) {
      stations = processStations(clientStations, latitude, longitude);
    } else {
      stations = await searchGooglePlacesNearby({ latitude, longitude, radiusKm: 5.0 });
    }

    const ranked = rankStations(stations);

    return res.json({
      success: true,
      recommendations: ranked.slice(0, 2),
      allRanked: ranked
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/recommendations', handleRecommendations);
router.post('/recommendations', handleRecommendations);

/**
 * 4. GET & POST /api/live-intelligence/new-station
 */
const handleNewStation = async (req, res) => {
  try {
    const latitude = Number(req.body?.latitude ?? req.query?.latitude);
    const longitude = Number(req.body?.longitude ?? req.query?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    let stations = [];
    const clientStations = req.body?.stations || null;
    if (Array.isArray(clientStations)) {
      stations = processStations(clientStations, latitude, longitude);
    } else {
      stations = await searchGooglePlacesNearby({ latitude, longitude, radiusKm: 5.0 });
    }

    const mlSummary = dataService.getSummary();
    const mlPredictions = dataService.getPredictions(1, 100);
    const gapAnalysis = analyzeChargingGap(stations, mlSummary, mlPredictions, { latitude, longitude });

    return res.json({
      success: true,
      proposedStation: gapAnalysis?.candidateArea || null,
      gapAnalysis
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

router.get('/new-station', handleNewStation);
router.post('/new-station', handleNewStation);

module.exports = router;