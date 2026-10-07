const OCM_API_URL =
  process.env.OCM_API_URL || 'https://api.openchargemap.io/v3';

const OCM_API_KEY = process.env.OCM_API_KEY;

// Calculate distance between two coordinates in kilometers
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const R = 6371; // Earth radius in km

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getNearbyStations({
  latitude,
  longitude,
  distanceKm = 5,
  maxResults = 10,
}) {
  if (!OCM_API_KEY) {
    throw new Error('OCM API key is not configured');
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Invalid latitude or longitude');
  }

  const params = new URLSearchParams({
    output: 'json',
    latitude: String(latitude),
    longitude: String(longitude),
    distance: String(distanceKm),
    distanceunit: 'KM',
    maxresults: String(maxResults),
  });

  const response = await fetch(
    `${OCM_API_URL}/poi/?${params.toString()}`,
    {
      headers: {
        'X-API-Key': OCM_API_KEY,
        'User-Agent': 'EVCharge-Live-Intelligence/1.0',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Open Charge Map request failed: ${response.status} ${response.statusText}`
    );
  }

  const rawStations = await response.json();

  // Calculate exact distance from user's live GPS
  const stationsWithDistance = rawStations
    .filter((station) => {
      const stationLat = Number(station.AddressInfo?.Latitude);
      const stationLon = Number(station.AddressInfo?.Longitude);

      return Number.isFinite(stationLat) && Number.isFinite(stationLon);
    })
    .map((station) => {
      const stationLat = Number(station.AddressInfo.Latitude);
      const stationLon = Number(station.AddressInfo.Longitude);

      const distance = calculateDistanceKm(
        latitude,
        longitude,
        stationLat,
        stationLon
      );

      return {
        ...station,
        distanceKm: Number(distance.toFixed(2)),
      };
    })
    // Make absolutely sure the station is within our radius
    .filter((station) => station.distanceKm <= distanceKm)
    // Nearest station first
    .sort((a, b) => a.distanceKm - b.distanceKm)
    // Only return the closest stations
    .slice(0, maxResults);

  console.log(
    'NEAREST STATIONS:',
    stationsWithDistance.map((station) => ({
      id: station.ID,
      name: station.AddressInfo?.Title,
      distanceKm: station.distanceKm,
      latitude: station.AddressInfo?.Latitude,
      longitude: station.AddressInfo?.Longitude,
    }))
  );

  return stationsWithDistance;
}

module.exports = {
  getNearbyStations,
};