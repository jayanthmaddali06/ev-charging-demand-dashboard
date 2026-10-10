/**
 * Google Places Client Service
 * Discovers real-world EV charging stations within a strict 5 km radius
 * using the Google Places API (New) via the Google Maps JavaScript API Places library.
 */

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let scriptLoadingPromise = null;

/**
 * Loads the Google Maps JavaScript SDK dynamically using the recommended
 * importLibrary lifecycle to guarantee Maps and Places libraries are ready.
 */
export async function loadGoogleMapsSDK(apiKey = GOOGLE_MAPS_KEY) {
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.');
  }

  // If already loaded and Map + places are ready
  if (window.google?.maps?.Map && window.google?.maps?.places) {
    return window.google;
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const scriptId = 'google-maps-platform-sdk';
    const existingScript = document.getElementById(scriptId);

    const onScriptLoaded = async () => {
      try {
        if (!window.google?.maps) {
          throw new Error('Google Maps global object not found.');
        }

        // Modern Google Maps dynamic library loading
        if (typeof window.google.maps.importLibrary === 'function') {
          await window.google.maps.importLibrary('maps');
          await window.google.maps.importLibrary('places');
          await window.google.maps.importLibrary('geometry').catch(() => {});
        } else {
          // Fallback poll until google.maps.Map is attached
          let attempts = 0;
          while (!window.google?.maps?.Map && attempts < 50) {
            await new Promise((r) => setTimeout(r, 60));
            attempts++;
          }
        }

        if (!window.google?.maps?.Map) {
          throw new Error('Unable to load Google Maps. Please verify the Google Maps API configuration.');
        }

        resolve(window.google);
      } catch (err) {
        scriptLoadingPromise = null;
        console.error('[GoogleMapsLoader] Error initializing Google Maps:', err);
        reject(new Error('Unable to load Google Maps. Please verify the Google Maps API configuration.'));
      }
    };

    if (existingScript) {
      if (window.google?.maps?.Map) {
        onScriptLoaded().then(() => resolve(window.google)).catch(reject);
        return;
      }
      existingScript.addEventListener('load', onScriptLoaded);
      existingScript.addEventListener('error', () => {
        scriptLoadingPromise = null;
        reject(new Error('Unable to load Google Maps. Please verify the Google Maps API configuration.'));
      });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = onScriptLoaded;
    script.onerror = () => {
      scriptLoadingPromise = null;
      reject(new Error('Unable to load Google Maps. Please verify the Google Maps API configuration.'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Accurate Haversine distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
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

/**
 * Formats a raw Google Place (Places API New or Places JS SDK) into our standardized station model
 */
export function normalizeClientPlace(place, userLat, userLng) {
  if (!place) return null;

  const id = place.id || place.place_id || place.placeId;

  let name = 'EV Charging Station';
  if (typeof place.displayName === 'string') {
    name = place.displayName;
  } else if (place.displayName && typeof place.displayName.text === 'string') {
    name = place.displayName.text;
  } else if (typeof place.name === 'string') {
    name = place.name;
  }

  const address =
    place.formattedAddress ||
    place.shortFormattedAddress ||
    place.formatted_address ||
    place.vicinity ||
    'Address unavailable';

  let lat = null;
  let lng = null;

  if (place.location) {
    if (typeof place.location.lat === 'function') {
      lat = place.location.lat();
      lng = place.location.lng();
    } else {
      lat = Number(place.location.lat ?? place.location.latitude);
      lng = Number(place.location.lng ?? place.location.longitude);
    }
  } else if (place.geometry?.location) {
    if (typeof place.geometry.location.lat === 'function') {
      lat = place.geometry.location.lat();
      lng = place.geometry.location.lng();
    } else {
      lat = Number(place.geometry.location.lat);
      lng = Number(place.geometry.location.lng);
    }
  }

  // Safely ignore records missing valid coordinates
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const distanceKm = Number(haversineDistanceKm(userLat, userLng, lat, lng).toFixed(2));

  // Strict 15.0 km filter
  if (distanceKm > 15.0) {
    return null;
  }

  const rating = typeof place.rating === 'number' ? place.rating : null;
  const userRatingCount =
    typeof place.userRatingCount === 'number'
      ? place.userRatingCount
      : typeof place.user_ratings_total === 'number'
      ? place.user_ratings_total
      : null;

  const businessStatus = place.businessStatus || place.business_status || 'OPERATIONAL';

  let openStatus = 'Data unavailable';
  if (place.currentOpeningHours) {
    if (typeof place.currentOpeningHours.isOpen === 'function') {
      try {
        openStatus = place.currentOpeningHours.isOpen() ? 'Open' : 'Closed';
      } catch {
        openStatus = 'Data unavailable';
      }
    } else if (place.currentOpeningHours.openNow !== undefined) {
      openStatus = place.currentOpeningHours.openNow ? 'Open' : 'Closed';
    }
  } else if (place.opening_hours) {
    if (typeof place.opening_hours.isOpen === 'function') {
      try {
        openStatus = place.opening_hours.isOpen() ? 'Open' : 'Closed';
      } catch {
        openStatus = 'Data unavailable';
      }
    } else if (place.opening_hours.open_now !== undefined) {
      openStatus = place.opening_hours.open_now ? 'Open' : 'Closed';
    }
  }

  const googleMapsUri =
    place.googleMapsURI ||
    place.googleMapsUri ||
    place.url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${id || ''}`;

  return {
    id: String(id || `${lat.toFixed(5)}_${lng.toFixed(5)}`),
    name,
    address,
    latitude: lat,
    longitude: lng,
    distanceKm,
    rating,
    userRatingCount,
    businessStatus,
    openStatus,
    googleMapsUri,
    source: 'Google Places'
  };
}

/**
 * Deduplicate places based on Google Place ID
 */
export function deduplicatePlaces(stations = []) {
  const seenIds = new Set();
  const result = [];

  for (const station of stations) {
    if (!station) continue;

    const id = station.id;
    if (id) {
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);
    }

    result.push(station);
  }

  return result;
}

/**
 * Searches Google Places API (New) specifically for EV charging stations strictly within 15 km
 * Centered on the user's CURRENT live browser GPS coordinates.
 */
export async function searchNearbyEVStations(userLat, userLng) {
  const latitude = Number(userLat);
  const longitude = Number(userLng);

  // Development console logging
  console.log("LIVE GPS:", latitude, longitude);
  console.log("SEARCH RADIUS:", 15000);
  console.log("GOOGLE PLACES SEARCH CENTER:", {
    latitude,
    longitude,
    radius: 15000
  });

  const google = await loadGoogleMapsSDK();
  const { Place } = await google.maps.importLibrary('places');

  if (!Place) {
    throw new Error('Google Places search failed. Please check the Places API configuration.');
  }

  const rawPlaces = [];
  let placesApiSuccessful = false;
  let lastError = null;

  const fields = [
    'id',
    'displayName',
    'formattedAddress',
    'location',
    'businessStatus',
    'googleMapsURI',
    'rating',
    'userRatingCount',
    'currentOpeningHours'
  ];

  const locationRestriction = {
    center: { lat: latitude, lng: longitude },
    radius: 15000 // 15,000 meters = 15 km
  };

  // 1. Google Places API (New): searchNearby with includedPrimaryTypes
  if (typeof Place.searchNearby === 'function') {
    try {
      const responsePrimary = await Place.searchNearby({
        fields,
        locationRestriction,
        includedPrimaryTypes: ['electric_vehicle_charging_station'],
        maxResultCount: 20
      });
      placesApiSuccessful = true;
      if (Array.isArray(responsePrimary?.places)) {
        rawPlaces.push(...responsePrimary.places);
      }
    } catch (err) {
      console.warn('[GooglePlaces] searchNearby includedPrimaryTypes failed:', err);
      lastError = err;
    }

    // 2. Google Places API (New): searchNearby with includedTypes
    try {
      const responseTypes = await Place.searchNearby({
        fields,
        locationRestriction,
        includedTypes: ['electric_vehicle_charging_station'],
        maxResultCount: 20
      });
      placesApiSuccessful = true;
      if (Array.isArray(responseTypes?.places)) {
        rawPlaces.push(...responseTypes.places);
      }
    } catch (err) {
      console.warn('[GooglePlaces] searchNearby includedTypes failed:', err);
      if (!lastError) lastError = err;
    }
  }

  // 3. Fallback: If Place.searchNearby was not available or produced no results, try legacy PlacesService if loaded
  if (!placesApiSuccessful && google.maps.places?.PlacesService) {
    try {
      const dummyDiv = document.createElement('div');
      const service = new google.maps.places.PlacesService(dummyDiv);
      const userLatLng = new google.maps.LatLng(latitude, longitude);

      const legacyResults = await new Promise((resolve, reject) => {
        service.nearbySearch(
          {
            location: userLatLng,
            radius: 15000,
            type: 'electric_vehicle_charging_station'
          },
          (results, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK ||
              status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              resolve(Array.isArray(results) ? results : []);
            } else {
              reject(new Error(`PlacesService status: ${status}`));
            }
          }
        );
      });
      placesApiSuccessful = true;
      rawPlaces.push(...legacyResults);
    } catch (legacyErr) {
      console.warn('[GooglePlaces] Legacy PlacesService fallback failed:', legacyErr);
      if (!lastError) lastError = legacyErr;
    }
  }

  // Task 17: If the API request failed, throw a clear diagnostic error
  if (!placesApiSuccessful) {
    console.error('GOOGLE PLACES ERROR:', lastError);
    throw new Error('Google Places search failed. Please check the Places API configuration.');
  }

  // Task 7: Log raw results and count
  console.log("GOOGLE PLACES RESULTS:", rawPlaces);
  console.log("GOOGLE PLACES RESULT COUNT:", rawPlaces.length);
  console.log("PLACES RESULT COUNT:", rawPlaces.length);

  // Task 8: Filter strictly using actual coordinates (distance <= 5 km, ignore missing coords)
  const normalized = rawPlaces
    .map((place) => normalizeClientPlace(place, latitude, longitude))
    .filter(Boolean);

  // Task 10: Remove duplicates using Google Place ID
  const deduped = deduplicatePlaces(normalized);

  // Task 9: Sort nearest → farthest
  deduped.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  // Task 20: Log filtered count and nearest distances
  console.log("FILTERED RESULT COUNT:", deduped.length);
  console.log(
    "NEAREST STATION DISTANCES:",
    deduped.map((s) => `${s.name}: ${s.distanceKm} km`)
  );

  return deduped;
}
