function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function analyzeChargingGap(
  stations = [],
  mlSummary = null,
  mlPredictions = null,
  userLocation = null
) {
  const validStations = Array.isArray(stations) ? stations : [];

  const stationCount = validStations.length;

  let totalConnections = 0;
  let operationalStations = 0;

  const stationDetails = validStations.map((station) => {
    const address = station.AddressInfo || {};
    const connections = Array.isArray(station.Connections)
      ? station.Connections
      : [];

    const connectionCount = connections.length;
    totalConnections += connectionCount;

    const isOperational = station.StatusType?.IsOperational;
    const status =
      typeof isOperational === 'boolean' ? isOperational : null;

    if (status === true) {
      operationalStations += 1;
    }

    return {
      id: station.ID,
      title: address.Title || 'Charging Station',
      address: address.AddressLine1 || 'Address unavailable',
      latitude: address.Latitude ?? null,
      longitude: address.Longitude ?? null,
      distanceKm:
        typeof station.distanceKm === 'number'
          ? station.distanceKm
          : typeof address.Distance === 'number'
            ? address.Distance
            : null,
      connectionCount,
      isOperational: status,
    };
  });

  const averageDemand =
    Number(mlSummary?.averageChargingDemand) || 0;

  const averageStationLoad =
    Number(mlSummary?.averageStationLoad) || 0;

  const averageQueueLength =
    Number(mlSummary?.averageQueueLength) || 0;

  const averageWaitingTime =
    Number(mlSummary?.averageWaitingTimeMinutes) || 0;

  const predictedDemandValues = Array.isArray(mlPredictions?.records)
    ? mlPredictions.records
        .map((record) => Number(record.randomForestPrediction))
        .filter(Number.isFinite)
    : [];

  const averagePredictedDemand =
    predictedDemandValues.length > 0
      ? predictedDemandValues.reduce((sum, value) => sum + value, 0) /
        predictedDemandValues.length
      : 0;

  const indicators = {
    limitedStationAvailability: stationCount <= 2,
    highStationLoad: averageStationLoad >= 70,
    highQueue: averageQueueLength >= 5,
    highWaitingTime: averageWaitingTime >= 15,
    highPredictedDemand: averagePredictedDemand >= 70,
  };

  const pressureFactors = [];

  if (indicators.limitedStationAvailability) {
    pressureFactors.push(
      'Limited nearby charging infrastructure'
    );
  }

  if (indicators.highStationLoad) {
    pressureFactors.push('High average station load');
  }

  if (indicators.highQueue) {
    pressureFactors.push('Elevated average charging queue');
  }

  if (indicators.highWaitingTime) {
    pressureFactors.push('Elevated average waiting time');
  }

  if (indicators.highPredictedDemand) {
    pressureFactors.push('High predicted charging demand');
  }

  /*
   * NEW STATION CANDIDATE ANALYSIS
   */

  let nearestStationDistanceKm = null;

  if (
    userLocation &&
    Number.isFinite(userLocation.latitude) &&
    Number.isFinite(userLocation.longitude)
  ) {
    const distances = stationDetails
      .filter(
        (station) =>
          Number.isFinite(station.latitude) &&
          Number.isFinite(station.longitude)
      )
      .map((station) =>
        haversineDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          station.latitude,
          station.longitude
        )
      );

    if (distances.length > 0) {
      nearestStationDistanceKm = Math.min(...distances);
    }
  }

  /*
   * Gap score:
   * - distance from existing station
   * - charging demand
   * - predicted demand
   * - station load
   * - queue
   * - waiting time
   */

  const distanceScore =
    nearestStationDistanceKm === null
      ? 100
      : Math.min((nearestStationDistanceKm / 10) * 100, 100);

  const demandScore = Math.min(averageDemand, 100);
  const predictedDemandScore = Math.min(
    averagePredictedDemand,
    100
  );

  const loadScore = Math.min(averageStationLoad, 100);

  const queueScore = Math.min(
    (averageQueueLength / 10) * 100,
    100
  );

  const waitingScore = Math.min(
    (averageWaitingTime / 20) * 100,
    100
  );

  const candidateScore = Math.round(
    distanceScore * 0.30 +
      demandScore * 0.20 +
      predictedDemandScore * 0.20 +
      loadScore * 0.15 +
      queueScore * 0.075 +
      waitingScore * 0.075
  );

  let candidateLevel = 'low';

  if (candidateScore >= 70) {
    candidateLevel = 'high';
  } else if (candidateScore >= 45) {
    candidateLevel = 'moderate';
  }

  const candidateReasons = [];

  if (
    nearestStationDistanceKm === null ||
    nearestStationDistanceKm >= 5
  ) {
    candidateReasons.push(
      'Existing charging stations are relatively far from the user location'
    );
  }

  if (averageDemand >= 60) {
    candidateReasons.push(
      'Charging demand is elevated'
    );
  }

  if (averagePredictedDemand >= 60) {
    candidateReasons.push(
      'Predicted charging demand is elevated'
    );
  }

  if (averageStationLoad >= 60) {
    candidateReasons.push(
      'Existing station load is elevated'
    );
  }

  if (averageQueueLength >= 5) {
    candidateReasons.push(
      'Charging queues are elevated'
    );
  }

  if (averageWaitingTime >= 15) {
    candidateReasons.push(
      'Waiting time is elevated'
    );
  }

  /*
   * Candidate location:
   *
   * We use the user's current location as the candidate
   * area when the analysis indicates a meaningful gap.
   *
   * This is an analytical candidate area, not a guaranteed
   * optimal construction site.
   */

  let candidateArea = null;

  if (candidateScore >= 35) {
    candidateArea = {
      latitude: Number(userLocation?.latitude) || null,
      longitude: Number(userLocation?.longitude) || null,
      score: candidateScore,
      level: candidateLevel,
      nearestStationDistanceKm:
        nearestStationDistanceKm !== null
          ? Number(nearestStationDistanceKm.toFixed(2))
          : null,
      reasons: candidateReasons,
      recommendation:
        'Potential area for further charging-station site investigation',
    };
  }

  let gapLevel = 'unknown';

  let explanation =
    'There is not enough information to determine a charging infrastructure gap.';

  if (stationCount === 0) {
    gapLevel = 'high';

    explanation =
      'No charging stations were returned within the searched area. ' +
      'This indicates limited mapped charging infrastructure, but additional local demand and infrastructure validation is required before making a planning decision.';
  } else if (
    stationCount <= 2 &&
    (
      indicators.highStationLoad ||
      indicators.highQueue ||
      indicators.highWaitingTime ||
      indicators.highPredictedDemand
    )
  ) {
    gapLevel = 'high';

    explanation =
      'A small number of charging stations were found while one or more existing ML indicators show elevated charging pressure. ' +
      'The combination suggests a stronger potential infrastructure gap and should be investigated further.';
  } else if (stationCount <= 2) {
    gapLevel = 'potential';

    explanation =
      'Only a small number of charging stations were found within the searched area. ' +
      'This indicates a potential infrastructure gap, but the available ML indicators do not currently show strong charging pressure.';
  } else {
    gapLevel = 'lower';

    explanation =
      'Multiple charging stations were found within the searched area. ' +
      'The available station and ML data do not indicate a strong infrastructure gap based on the current analysis.';
  }

  return {
    stationCount,
    totalConnections,
    operationalStations,

    mlContext: {
      averageChargingDemand: Number(
        averageDemand.toFixed(2)
      ),
      averageStationLoad: Number(
        averageStationLoad.toFixed(2)
      ),
      averageQueueLength: Number(
        averageQueueLength.toFixed(2)
      ),
      averageWaitingTimeMinutes: Number(
        averageWaitingTime.toFixed(1)
      ),
      averagePredictedDemand: Number(
        averagePredictedDemand.toFixed(2)
      ),
    },

    indicators,

    pressureFactors,

    gapLevel,
    explanation,

    nearestStationDistanceKm,

    candidateArea,

    stationDetails,
  };
}

module.exports = {
  analyzeChargingGap,
};