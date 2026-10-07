const OCM_API_URL =
  process.env.OCM_API_URL || 'https://api.openchargemap.io/v3';

const OCM_API_KEY = process.env.OCM_API_KEY;

async function getNearbyStations({
  latitude,
  longitude,
  distanceKm = 25,
  maxResults = 50,
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

  return response.json();
}

module.exports = {
  getNearbyStations,
};