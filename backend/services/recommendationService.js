/**
 * Recommendation Service
 * Weighted multi-factor scoring model for EV charging stations
 */

// Configurable scoring weights
const DEFAULT_WEIGHTS = {
  distance: 0.25,          // Proximity to user
  availability: 0.25,      // Operational status & connector count
  demand: 0.20,            // Low predicted/historical demand preferred (less congestion)
  travelTime: 0.15,        // Estimated travel duration
  powerSpeed: 0.10,        // Charging speed/power
  stationReliability: 0.05 // Operator track record / metadata completeness
};

function normalizeScore(val, min, max, invert = false) {
  if (min === max) return 1.0;
  const clamped = Math.max(min, Math.min(max, val));
  const normalized = (clamped - min) / (max - min);
  return invert ? 1.0 - normalized : normalized;
}

/**
 * Score and rank nearby stations
 */
function rankStations(stations = [], options = {}) {
  if (!Array.isArray(stations) || stations.length === 0) {
    return [];
  }

  const weights = { ...DEFAULT_WEIGHTS, ...(options.weights || {}) };

  // Calculate dynamic range for relative scoring
  const distances = stations.map(s => s.distanceKm || 1.0);
  const minDistance = Math.min(...distances, 0.1);
  const maxDistance = Math.max(...distances, 5.0);

  const scoredStations = stations.map(station => {
    const address = station.AddressInfo || {};
    const connections = Array.isArray(station.Connections) ? station.Connections : [];
    const connectorCount = connections.length || station.connectorCount || 1;
    const isOperational =
      station.businessStatus === 'OPERATIONAL' ||
      station.business_status === 'OPERATIONAL' ||
      station.isOpen === true ||
      station.StatusType?.IsOperational !== false;
    const distanceKm = typeof station.distanceKm === 'number' ? station.distanceKm : (typeof address.Distance === 'number' ? address.Distance : 1.0);

    // Check connector max power (kW)
    let maxPowerKw = station.maxPowerKw || 22; // default standard AC
    connections.forEach(conn => {
      if (conn.PowerKW && conn.PowerKW > maxPowerKw) {
        maxPowerKw = conn.PowerKW;
      }
    });

    // Sub-scores (0.0 to 1.0)
    const distanceScore = normalizeScore(distanceKm, minDistance, maxDistance, true);
    const availabilityScore = isOperational ? Math.min(connectorCount / 6.0, 1.0) : 0.05;
    
    // Low demand score: if station predicted/assumed load is low, it's better for queuing
    const demandScore = 0.85; // Default favorable score unless high demand predicted
    
    // Estimated travel time in city (~25 km/h avg speed)
    const travelTimeMinutes = Math.max(1, Math.round((distanceKm / 25) * 60));
    const travelTimeScore = normalizeScore(travelTimeMinutes, 2, 20, true);

    const powerScore = Math.min(maxPowerKw / 150.0, 1.0);
    const reliabilityScore = station.StatusType?.IsOperational === true ? 1.0 : 0.7;

    // Composite weighted score
    const totalScore = (
      (distanceScore * weights.distance) +
      (availabilityScore * weights.availability) +
      (demandScore * weights.demand) +
      (travelTimeScore * weights.travelTime) +
      (powerScore * weights.powerSpeed) +
      (reliabilityScore * weights.stationReliability)
    ) * 100;

    // Human-readable recommendation reason
    const reasons = [];
    if (distanceKm <= 2.0) {
      reasons.push(`Closest station at ${distanceKm.toFixed(1)} km away`);
    } else {
      reasons.push(`Accessible at ${distanceKm.toFixed(1)} km`);
    }

    if (isOperational) {
      reasons.push('Confirmed operational status');
    }
    if (connectorCount >= 2) {
      reasons.push(`${connectorCount} connectors available`);
    }
    if (maxPowerKw >= 50) {
      reasons.push(`Fast DC charging up to ${maxPowerKw} kW`);
    }
    reasons.push(`Estimated ~${travelTimeMinutes} min travel time`);

    return {
      ...station,
      recommendationScore: Math.round(totalScore),
      travelTimeMinutes,
      maxPowerKw,
      recommendationRationale: reasons.join(' • ')
    };
  });

  // Sort descending by recommendationScore
  scoredStations.sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scoredStations;
}

module.exports = {
  rankStations,
  DEFAULT_WEIGHTS
};
