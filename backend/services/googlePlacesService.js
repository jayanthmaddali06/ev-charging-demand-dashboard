/**
 * Google Places Service for EV Charging Station Discovery
 * Uses Google Places API (New) for location discovery when server key is provided,
 * and provides normalization, geographic filtering, and deduplication.
 */

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

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

/**
 * Normalizes a Google Place (from Places API New or Places JS SDK)
 * into a standardized station object strictly without fake telemetry.
 */
function normalizeGooglePlace(place, userLat, userLng) {
  if (!place) return null;

  const id = place.id || place.place_id || place.placeId;
  const name =
    (place.displayName && typeof place.displayName === 'object'
      ? place.displayName.text
      : place.displayName) ||
    place.name ||
    'EV Charging Station';

  const address =
    place.formattedAddress ||
    place.shortFormattedAddress ||
    place.formatted_address ||
    place.address ||
    place.vicinity ||
    'Address unavailable';

  let lat = null;
  let lng = null;

  if (place.location) {
    if (typeof place.location.lat === 'function') {
      lat = place.location.lat();
      lng = place.location.lng();
    } else {
      lat = Number(place.location.latitude ?? place.location.lat);
      lng = Number(place.location.longitude ?? place.location.lng);
    }
  } else if (place.geometry?.location) {
    if (typeof place.geometry.location.lat === 'function') {
      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
    } else {
      lat = Number(place.geometry.location.lat);
      lng = Number(place.geometry.location.lng);
    }
  } else if (place.latitude != null && place.longitude != null) {
    lat = Number(place.latitude);
    lng = Number(place.longitude);
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  let distanceKm = null;
  if (userLat != null && userLng != null) {
    distanceKm = Number(calculateDistanceKm(userLat, userLng, lat, lng).toFixed(2));
  } else if (typeof place.distanceKm === 'number') {
    distanceKm = place.distanceKm;
  }

  const businessStatus = place.businessStatus || place.business_status || 'OPERATIONAL';
  const rating = typeof place.rating === 'number' ? place.rating : null;
  const userRatingCount =
    typeof place.userRatingCount === 'number'
      ? place.userRatingCount
      : typeof place.user_ratings_total === 'number'
      ? place.user_ratings_total
      : null;

  let openStatus = place.openStatus || 'Data unavailable';
  if (place.currentOpeningHours?.openNow !== undefined) {
    openStatus = place.currentOpeningHours.openNow ? 'Open' : 'Closed';
  } else if (place.opening_hours?.open_now !== undefined) {
    openStatus = place.opening_hours.open_now ? 'Open' : 'Closed';
  } else if (place.regularOpeningHours?.openNow !== undefined) {
    openStatus = place.regularOpeningHours.openNow ? 'Open' : 'Closed';
  }

  const googleMapsUri =
    place.googleMapsUri ||
    place.googleMapsURI ||
    place.url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${id || ''}`;

  return {
    id: String(id || `${lat.toFixed(5)}_${lng.toFixed(5)}`),
    name: String(name),
    address: String(address),
    latitude: lat,
    longitude: lng,
    distanceKm,
    rating,
    userRatingCount,
    businessStatus,
    openStatus,
    googleMapsUri,
    source: place.source || 'Google Places'
  };
}

/**
 * Deduplicates stations using Google Place ID and coordinate proximity (< 50m)
 */
function deduplicateStations(stations = []) {
  const seenIds = new Set();
  const unique = [];

  for (const station of stations) {
    if (!station) continue;

    const id = station.id;
    if (id && seenIds.has(id)) {
      continue;
    }

    const stationName = String(station.name || '').toLowerCase();

    // Check spatial duplicate (< 0.05 km / 50 meters)
    const isNearbyDuplicate = unique.some((existing) => {
      if (
        Number.isFinite(existing.latitude) &&
        Number.isFinite(existing.longitude) &&
        Number.isFinite(station.latitude) &&
        Number.isFinite(station.longitude)
      ) {
        const dist = calculateDistanceKm(
          existing.latitude,
          existing.longitude,
          station.latitude,
          station.longitude
        );
        const existingName = String(existing.name || '').toLowerCase();
        return dist < 0.05 && existingName === stationName;
      }
      return false;
    });

    if (!isNearbyDuplicate) {
      if (id) seenIds.add(id);
      unique.push(station);
    }
  }

  return unique;
}

/**
 * Server-side Google Places (New) search if GOOGLE_MAPS_SERVER_API_KEY is configured
 */
async function searchGooglePlacesNearby({ latitude, longitude, radiusKm = 15.0 }) {
  const serverKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!serverKey) {
    return [];
  }

  try {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const requestBody = {
      includedTypes: ['electric_vehicle_charging_station'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: Number(latitude),
            longitude: Number(longitude)
          },
          radius: radiusKm * 1000.0 // 5000 meters
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': serverKey,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.businessStatus,places.googleMapsUri,places.currentOpeningHours'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.warn(`[GooglePlaces] Server lookup failed: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const rawPlaces = Array.isArray(data.places) ? data.places : [];

    const normalized = rawPlaces
      .map((p) => normalizeGooglePlace(p, latitude, longitude))
      .filter((s) => s && s.distanceKm !== null && s.distanceKm <= radiusKm);

    const deduped = deduplicateStations(normalized);
    deduped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    return deduped;
  } catch (err) {
    console.error('[GooglePlaces] Search error:', err.message);
    return [];
  }
}

module.exports = {
  calculateDistanceKm,
  normalizeGooglePlace,
  deduplicateStations,
  searchGooglePlacesNearby
};
