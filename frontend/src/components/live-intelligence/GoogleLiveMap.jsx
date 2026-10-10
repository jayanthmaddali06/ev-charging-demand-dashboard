import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { loadGoogleMapsSDK } from '../../services/googlePlacesClient';

/**
 * GoogleLiveMap
 * Renders an interactive map strictly using Google Maps Platform.
 *
 * Map Legend:
 * - Blue = You (Current Live GPS location)
 * - Green = 4 nearest Google Places charging stations
 * - Red = Other nearby Google Places charging stations
 * - Orange = Potential area (AI/ML Proposed New EV Station)
 */
const GoogleLiveMap = ({
  userLocation = null,
  nearestStations = [],
  otherStations = [],
  proposedStation = null,
  selectedStation = null,
  onSelectStation = () => {},
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Initialize Google Maps JS API and wait for libraries
  useEffect(() => {
    let isMounted = true;

    if (!apiKey) {
      setLoadError('Google Maps API key is not configured.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError('');

    loadGoogleMapsSDK(apiKey)
      .then(async (google) => {
        if (!isMounted || !mapContainerRef.current) return;

        // Ensure maps & places libraries are imported
        const { Map } = await google.maps.importLibrary('maps');
        await google.maps.importLibrary('places').catch(() => {});
        await google.maps.importLibrary('geometry').catch(() => {});

        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const centerLat = userLocation?.latitude || 17.3850;
          const centerLng = userLocation?.longitude || 78.4867;

          const map = new Map(mapContainerRef.current, {
            center: { lat: centerLat, lng: centerLng },
            zoom: 14,
            mapTypeId: 'roadmap',
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          mapInstanceRef.current = map;
          setIsLoading(false);
          setIsMapReady(true);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[GoogleLiveMap] Initialization error:', err);
        setLoadError('Unable to load Google Maps. Please verify the Google Maps API configuration.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // 2. Render Markers, Overlays, and Routes once the map is fully ready
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.google?.maps?.Map) return;

    const map = mapInstanceRef.current;
    const google = window.google;

    // Clear existing markers & overlays
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    // ──────────────────────────────────────────────────────────
    // A. BLUE MARKER: Current User Location (Live GPS)
    // ──────────────────────────────────────────────────────────
    if (userLocation && Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude)) {
      const userLatLng = { lat: Number(userLocation.latitude), lng: Number(userLocation.longitude) };
      bounds.extend(userLatLng);

      const userMarker = new google.maps.Marker({
        position: userLatLng,
        map,
        title: 'You (Current Live GPS Location)',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#2563eb', // Blue
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        zIndex: 100
      });

      const userInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: inherit; padding: 4px; color: #0f172a;">
            <div style="font-weight: 700; color: #1d4ed8; font-size: 13px;">📍 You (Current Location)</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}
            </div>
            <div style="font-size: 10px; color: #2563eb; font-weight: 600; margin-top: 4px;">
              Live Browser GPS Position
            </div>
          </div>
        `
      });

      userMarker.addListener('click', () => userInfoWindow.open(map, userMarker));
      markersRef.current.push(userMarker);

      // Strict 15 KM search radius circle
      const radiusCircle = new google.maps.Circle({
        strokeColor: '#2563eb',
        strokeOpacity: 0.35,
        strokeWeight: 1.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.04,
        map,
        center: userLatLng,
        radius: 15000 // Strict 15 KM
      });
      circlesRef.current.push(radiusCircle);
    }

    // ──────────────────────────────────────────────────────────
    // B. GREEN MARKERS: 4 Nearest Charging Stations
    // ──────────────────────────────────────────────────────────
    nearestStations.forEach((station, idx) => {
      const lat = Number(station.latitude);
      const lng = Number(station.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = { lat, lng };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: `★ Nearest #${idx + 1}: ${station.name}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#10b981', // Green
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2.5
        },
        zIndex: 90 - idx
      });

      const distText = station.distanceKm != null ? (station.distanceKm < 1 ? `${Math.round(station.distanceKm * 1000)} m from you` : `${station.distanceKm} km from you`) : 'Within 5 km';
      const openLabel = station.openStatus === 'Open' ? '<span style="color:#10b981;font-weight:700;">Open</span>' : (station.openStatus === 'Closed' ? '<span style="color:#ef4444;font-weight:700;">Closed</span>' : '<span style="color:#64748b;">Data unavailable</span>');

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: inherit; min-width: 200px; padding: 4px; color: #0f172a;">
            <div style="color: #047857; font-weight: 700; font-size: 11px; text-transform: uppercase;">
              ★ 4 Nearest • #${idx + 1}
            </div>
            <div style="font-weight: 700; color: #0f172a; margin-top: 2px; font-size: 13px;">
              ${station.name}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 1px;">
              ${station.address}
            </div>
            <div style="margin-top: 6px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #2563eb;">📍 ${distText}</span>
              <span>Status: ${openLabel}</span>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #475569; display: flex; justify-content: space-between;">
              <span style="background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Google Places</span>
              ${station.rating ? `<span>★ ${station.rating} (${station.userRatingCount || 0})</span>` : ''}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        onSelectStation(station);
      });

      markersRef.current.push(marker);
    });

    // ──────────────────────────────────────────────────────────
    // C. RED MARKERS: Other Nearby Charging Stations (within 5 km)
    // ──────────────────────────────────────────────────────────
    otherStations.forEach((station) => {
      const lat = Number(station.latitude);
      const lng = Number(station.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const pos = { lat, lng };
      bounds.extend(pos);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: station.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6.5,
          fillColor: '#ef4444', // Red
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        zIndex: 60
      });

      const distText = station.distanceKm != null ? `${station.distanceKm} km from you` : 'Within 5 km';
      const openLabel = station.openStatus === 'Open' ? '<span style="color:#10b981;font-weight:700;">Open</span>' : (station.openStatus === 'Closed' ? '<span style="color:#ef4444;font-weight:700;">Closed</span>' : '<span style="color:#64748b;">Data unavailable</span>');

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: inherit; min-width: 190px; padding: 4px; color: #0f172a;">
            <div style="color: #dc2626; font-weight: 700; font-size: 11px; text-transform: uppercase;">
              Other Nearby Station
            </div>
            <div style="font-weight: 700; color: #0f172a; margin-top: 2px; font-size: 13px;">
              ${station.name}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-top: 1px;">
              ${station.address}
            </div>
            <div style="margin-top: 6px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #dc2626;">📍 ${distText}</span>
              <span>Status: ${openLabel}</span>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #475569;">
              <span style="background: #fef2f2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Google Places</span>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        onSelectStation(station);
      });

      markersRef.current.push(marker);
    });

    // ──────────────────────────────────────────────────────────
    // D. ORANGE MARKER & AREA: Potential Area (ML Proposed Station)
    // ──────────────────────────────────────────────────────────
    if (proposedStation && Number.isFinite(proposedStation.latitude) && Number.isFinite(proposedStation.longitude)) {
      const pos = { lat: Number(proposedStation.latitude), lng: Number(proposedStation.longitude) };
      bounds.extend(pos);

      const orangeMarker = new google.maps.Marker({
        position: pos,
        map,
        title: 'AI/ML Proposed New EV Station Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9.5,
          fillColor: '#f59e0b', // Orange
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        zIndex: 85
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family: inherit; min-width: 210px; padding: 4px; color: #0f172a;">
            <div style="color: #d97706; font-weight: 800; font-size: 11px; text-transform: uppercase;">
              ⚡ AI/ML Proposed Infrastructure Gap
            </div>
            <div style="font-weight: 700; font-size: 13px; margin-top: 3px;">
              Suggested New Station Location
            </div>
            <div style="font-size: 11px; color: #1e293b; margin-top: 4px;">
              Gap Priority Score: <strong style="color:#d97706;">${proposedStation.score}/100</strong>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              ~${proposedStation.distanceFromUserKm || 1.6} km from your live GPS • Decision Support Area
            </div>
          </div>
        `
      });

      orangeMarker.addListener('click', () => infoWindow.open(map, orangeMarker));
      markersRef.current.push(orangeMarker);

      // Orange Candidate Circular Area (~450 meters)
      const candidateCircle = new google.maps.Circle({
        strokeColor: '#d97706',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.16,
        map,
        center: pos,
        radius: 450
      });
      circlesRef.current.push(candidateCircle);
    }

    // Auto fit bounds
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  }, [isMapReady, userLocation, nearestStations, otherStations, proposedStation, selectedStation]);

  if (loadError) {
    return (
      <div className="w-full h-[540px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-white">{loadError}</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Please verify that the Google Maps API key has Maps JavaScript API and Places API enabled in Google Cloud Console.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[540px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Loading Google Maps...</h3>
          <p className="text-xs text-slate-500 mt-1">Initializing Maps and Places libraries</p>
        </div>
      )}

      {/* Map Legend */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-lg text-xs space-y-2">
          <div className="font-extrabold text-slate-900 dark:text-white text-[11px] uppercase tracking-wider">
            Map Legend
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white flex-shrink-0 shadow-sm" />
            <span>Blue = You</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white flex-shrink-0 shadow-sm" />
            <span>Green = 4 nearest</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white flex-shrink-0 shadow-sm" />
            <span>Red = Other nearby</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white flex-shrink-0 shadow-sm" />
            <span>Orange = Potential area</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleLiveMap;
