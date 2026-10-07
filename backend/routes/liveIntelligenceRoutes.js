const express = require('express');
const { getNearbyStations } = require('../services/openChargeMapService');
const { analyzeChargingGap } = require('../services/chargingGapService');
const dataService = require('../services/dataService');

const router = express.Router();

router.get('/nearby-stations', async (req, res) => {
  try {
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);

     console.log('📍 LIVE GPS RECEIVED:', {
      latitude,
      longitude
    });

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required',
      });
    }

    const stations = await getNearbyStations({
      latitude,
      longitude,
      distanceKm: 5,
      maxResults: 50,
    });

    console.log('OCM STATIONS RETURNED:', stations.map(station => ({
  id: station.ID,
  name: station.AddressInfo?.Title,
  latitude: station.AddressInfo?.Latitude,
  longitude: station.AddressInfo?.Longitude,
})));

    const mlSummary = dataService.getSummary();
const mlPredictions = dataService.getPredictions(1, 100);

const analysis = analyzeChargingGap(
  stations,
  mlSummary,
  mlPredictions,
  {
    latitude,
    longitude,
  }
);

   return res.json({
    success: true,
    source: 'Open Charge Map',
    count: stations.length,
    stations,
    analysis,
    });
  } catch (error) {
    console.error('Live Intelligence station lookup failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve nearby charging stations',
    });
  }
});

module.exports = router;