import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Loader2,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LocateFixed,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Compass,
  Star
} from 'lucide-react';
import GoogleLiveMap from '../components/live-intelligence/GoogleLiveMap';
import { searchNearbyEVStations } from '../services/googlePlacesClient';
import { api } from '../services/api';

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const LiveIntelligence = () => {
  // ────────────────────────────────────────────────────────────
  // LOCATION & SEARCH STATE
  // ────────────────────────────────────────────────────────────
  const [coordinates, setCoordinates] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Station collections
  const [allStations, setAllStations] = useState([]);
  const [nearestFour, setNearestFour] = useState([]);
  const [otherNearby, setOtherNearby] = useState([]);
  const [showAllOther, setShowAllOther] = useState(false);

  // ML Intelligence outputs
  const [proposedStation, setProposedStation] = useState(null);
  const [demandSummary, setDemandSummary] = useState(null);
  const [temporalContext, setTemporalContext] = useState(null);

  // Navigation state
  const [selectedStation, setSelectedStation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  // ────────────────────────────────────────────────────────────
  // FORMATTING HELPERS
  // ────────────────────────────────────────────────────────────
  const formatDistanceDisplay = (distKm) => {
    if (distKm == null || !Number.isFinite(distKm)) return 'Data unavailable';
    if (distKm < 1.0) {
      return `${Math.round(distKm * 1000)} m from you`;
    }
    return `${distKm.toFixed(1)} km from you`;
  };

  // ────────────────────────────────────────────────────────────
  // DISCOVERY WORKFLOW: USE MY LIVE LOCATION
  // ────────────────────────────────────────────────────────────
  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Your browser does not support live location.');
      return;
    }

    setLocationStatus('Requesting browser GPS...');
    setError('');
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const liveCoords = { latitude, longitude };

        setCoordinates(liveCoords);
        setLocationStatus('Live location acquired.');

        try {
          // 1. Discover EV charging stations strictly within 5 km using Google Places API (New)
          let discovered = [];
          try {
            discovered = await searchNearbyEVStations(latitude, longitude);
          } catch (placesErr) {
            console.error('[LiveIntelligence] Google Places discovery error:', placesErr);
            setError('Google Places search failed. Please check the Places API configuration.');
            setLoading(false);
            return;
          }

          // 2. Query ML backend for temporal demand intelligence & charging gap analysis
          try {
            const analysisRes = await api.getLiveIntelligenceAnalysis(
              latitude,
              longitude,
              discovered
            );

            if (analysisRes && analysisRes.success) {
              const finalStations =
                Array.isArray(analysisRes.stations) && analysisRes.stations.length > 0
                  ? analysisRes.stations
                  : discovered;

              // Sort strictly nearest to farthest
              finalStations.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

              // Separate exactly 4 nearest vs other nearby stations within 15 km
              const firstFour = finalStations.slice(0, 4);
              const remaining = finalStations.slice(4);

              setAllStations(finalStations);
              setNearestFour(firstFour);
              setOtherNearby(remaining);

              setProposedStation(analysisRes.proposedStation || null);
              setDemandSummary(analysisRes.demandSummary || null);
              setTemporalContext(analysisRes.temporalContext || null);

              if (firstFour.length > 0) {
                setSelectedStation(firstFour[0]);
              }
            } else {
              const errMsg = analysisRes?.message || 'Live intelligence analysis failed on backend.';
              console.warn('[LiveIntelligence] Analysis unsuccessful:', errMsg);
              setError(`Live intelligence analysis unavailable: ${errMsg}`);
            }
          } catch (analyzeErr) {
            console.error('[LiveIntelligence] /analyze request failed:', {
              status: analyzeErr?.response?.status,
              message: analyzeErr?.message,
              url: analyzeErr?.config?.url || '/live-intelligence/analyze'
            });

            // Keep discovered stations visible even if backend analysis fails
            const firstFour = discovered.slice(0, 4);
            const remaining = discovered.slice(4);
            setAllStations(discovered);
            setNearestFour(firstFour);
            setOtherNearby(remaining);
            if (firstFour.length > 0) {
              setSelectedStation(firstFour[0]);
            }

            // Differentiate error accurately
            if (!analyzeErr.response) {
              setError('Backend service is unreachable. Please verify https://ev-charging-node-backend.onrender.com is deployed and active.');
            } else if (analyzeErr.response.status === 404) {
              setError('Live intelligence route not found on backend (404). Please ensure the latest backend deployment on Render is active.');
            } else if (analyzeErr.response.status === 500) {
              setError('Backend live intelligence analysis error (500). Please check the backend and ML service logs.');
            } else {
              setError(analyzeErr.message || 'Live intelligence analysis is temporarily unavailable.');
            }
          }
        } catch (err) {
          console.error('[LiveIntelligence] General error:', err?.message || err);
          setError(err.message || 'An unexpected error occurred during live intelligence processing.');
        } finally {
          setLoading(false);
        }
      },
      (positionError) => {
        setLoading(false);
        setLocationStatus('');

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setError('Location permission is required to find charging stations near you.');
        } else if (positionError.code === positionError.TIMEOUT) {
          setError('Unable to get your current location. Please try again.');
        } else {
          setError('Unable to get your current location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleNavigateToStation = (station) => {
    setSelectedStation(station);

    // Open Google Maps navigation externally using selected station and live GPS coordinates
    const originParam = coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
      ? `&origin=${coordinates.latitude},${coordinates.longitude}`
      : '';
    const destinationParam = `${station.latitude},${station.longitude}`;
    const navUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destinationParam}`;
    window.open(navUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE HEADER                                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Navigation className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Google Maps Platform & ML Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Live Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time EV charging stations discovered via Google Places around your live GPS location.
            </p>
          </div>
        </div>

        {coordinates && (
          <button
            onClick={handleUseMyLocation}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Nearby Stations</span>
          </button>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. LOCATION PROMPT / STATUS CARD                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Find EV Stations Near You
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Charging stations within 15 km of your live location. Powered by Google Places and real-time browser GPS coordinates.
            </p>

            {coordinates && (
              <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Lat: <strong className="text-blue-600 dark:text-blue-400">{coordinates.latitude.toFixed(5)}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Lng: <strong className="text-blue-600 dark:text-blue-400">{coordinates.longitude.toFixed(5)}</strong>
                </span>
                {locationStatus && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-sans font-medium text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {locationStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleUseMyLocation}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <LocateFixed className="w-5 h-5" />
              )}
              <span>{loading ? 'Locating...' : 'USE MY LIVE LOCATION'}</span>
            </button>
          </div>
        </div>

        {/* Error handling with Try Again button */}
        {error && (
          <div className="mt-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">{error}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                  {error.toLowerCase().includes('location') || error.toLowerCase().includes('permission')
                    ? 'Please verify browser geolocation permissions or check your device GPS.'
                    : 'Check your network connection or verify that the backend and ML services are online.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleUseMyLocation}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. GOOGLE CHARGING MAP AREA                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div id="google-map-section" className="space-y-3">
        <GoogleLiveMap
          userLocation={coordinates}
          nearestStations={nearestFour}
          otherStations={otherNearby}
          proposedStation={proposedStation}
          selectedStation={selectedStation}
          onSelectStation={(s) => setSelectedStation(s)}
          apiKey={GOOGLE_MAPS_KEY}
        />

        {/* Selected Station Navigation Bar */}
        {selectedStation && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  Selected Charging Station
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedStation.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300">
                  {formatDistanceDisplay(selectedStation.distanceKm)}
                </span>
                {selectedStation.openStatus && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                    ({selectedStation.openStatus})
                  </span>
                )}
              </div>
              <a
                href={
                  coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
                    ? `https://www.google.com/maps/dir/?api=1&origin=${coordinates.latitude},${coordinates.longitude}&destination=${selectedStation.latitude},${selectedStation.longitude}`
                    : `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
              >
                <span>Navigate in Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. FOUR NEAREST CHARGING STATIONS                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {coordinates && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              4 Nearest Charging Stations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The four closest Google charging places to your live location.
            </p>
          </div>

          {nearestFour.length === 0 && !loading ? (
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Google charging stations were found within 15 km of your current location.
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No distant fallback stations are shown to maintain location integrity. Check the suggested new charging station recommendation below.
              </p>
              <button
                onClick={handleUseMyLocation}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                Refresh Nearby Stations
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nearestFour.map((station) => (
                <div
                  key={station.id}
                  className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Icon + Name */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Zap className="w-5 h-5 fill-emerald-500/20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {station.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {station.address}
                        </p>
                      </div>
                    </div>

                    {/* Distance from you */}
                    <div className="mt-3.5 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatDistanceDisplay(station.distanceKm)}
                    </div>

                    {/* Rating / Open status */}
                    <div className="flex items-center gap-3 mt-3 text-xs">
                      {station.rating && (
                        <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{station.rating}</span>
                          <span className="text-slate-400 font-normal">({station.userRatingCount || 0})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2 mb-3">
                      <a
                        href={station.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs text-center transition inline-flex items-center justify-center gap-1.5"
                      >
                        <span>Open in Maps</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleNavigateToStation(station)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center transition inline-flex items-center justify-center gap-1.5"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Navigate</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/50">
                        Google Places
                      </span>
                      <span className={`font-semibold ${station.openStatus === 'Open' ? 'text-emerald-600' : station.openStatus === 'Closed' ? 'text-rose-500' : 'text-slate-400'}`}>
                        {station.openStatus}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. OTHER NEARBY CHARGING STATIONS                          */}
      {/* ────────────────────────────────────────────────────────── */}
      {coordinates && otherNearby.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Other Nearby Charging Stations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Additional places returned by Google Places.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(showAllOther ? otherNearby : otherNearby.slice(0, 6)).map((station) => (
              <div
                key={station.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {station.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {station.address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs font-bold text-red-600 dark:text-red-400">
                    {formatDistanceDisplay(station.distanceKm)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 mb-2.5">
                    <a
                      href={station.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs text-center transition inline-flex items-center justify-center gap-1"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => handleNavigateToStation(station)}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs text-center transition inline-flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigate</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium">
                      Google Places
                    </span>
                    <span className={`font-semibold ${station.openStatus === 'Open' ? 'text-emerald-600' : station.openStatus === 'Closed' ? 'text-rose-500' : 'text-slate-400'}`}>
                      {station.openStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* See More Toggle */}
          {otherNearby.length > 6 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowAllOther(!showAllOther)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
              >
                <span>{showAllOther ? 'Show Less' : `See More (${otherNearby.length - 6} more stations)`}</span>
                {showAllOther ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. TEMPORAL DEMAND INTELLIGENCE                            */}
      {/* ────────────────────────────────────────────────────────── */}
      {coordinates && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Temporal Demand Intelligence
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Machine learning demand inference contextualized by current time and day.
              </p>
            </div>
          </div>

          {temporalContext ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{temporalContext.day_of_week || 'Unavailable'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Day Classification</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{temporalContext.day_type || 'Unavailable'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Period</span>
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1.5">{temporalContext.period || 'Unavailable'}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Predicted Demand</span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                  {demandSummary && demandSummary.available && demandSummary.predictedDemandKwh != null
                    ? `${demandSummary.predictedDemandKwh} ${demandSummary.unit || 'kWh'}${demandSummary.demandLevel ? ` (${demandSummary.demandLevel})` : ''}`
                    : 'Unavailable'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-sm text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Temporal demand prediction temporarily unavailable. Please ensure the ML service is running and try refreshing.</span>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. SUGGESTED NEW EV CHARGING STATION LOCATION              */}
      {/* ────────────────────────────────────────────────────────── */}
      {coordinates && (
        <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-500/10 dark:from-amber-950/20 dark:to-slate-900 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold">
                ⚡
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  AI/ML PROPOSED CHARGING LOCATION
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Suggested New EV Charging Station Location
                </h3>
              </div>
            </div>
            {proposedStation && (
              <div className="px-4 py-2 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-sm text-center">
                Charging Gap Score: {proposedStation.score != null ? `${proposedStation.score}/100` : 'Unavailable'}
              </div>
            )}
          </div>

          {proposedStation ? (
            <>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Distance From You</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {proposedStation.distanceFromUserKm != null
                      ? `~${proposedStation.distanceFromUserKm} km`
                      : 'Unavailable'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gap Priority Level</span>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1 capitalize">
                    {proposedStation.level
                      ? `${proposedStation.level.charAt(0).toUpperCase() + proposedStation.level.slice(1).toLowerCase()} Priority`
                      : 'Unavailable'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-amber-500/20">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Urban / Area Profile</span>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {proposedStation.locationType || 'Unavailable'}
                  </p>
                </div>
              </div>

              {/* Rationale List */}
              <div className="mt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  WHY THIS LOCATION?
                </h4>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {proposedStation.reasons?.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-amber-500/20 text-[11px] text-amber-700/80 dark:text-amber-400/80 italic">
                This is a decision-support suggestion, not a guaranteed construction recommendation.
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Station location recommendation temporarily unavailable. Please ensure the ML service is running and try refreshing.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveIntelligence;