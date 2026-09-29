import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ------------------------------------------------------------
// LEAFLET DEFAULT ICON FIX
// ------------------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ------------------------------------------------------------
// USER LOCATION ICON
// ------------------------------------------------------------

const userIcon = L.divIcon({
  className: 'ev-user-marker',
  html: `
    <div
      style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #2563eb;
        border: 4px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      "
    ></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ------------------------------------------------------------
// SELECTED STATION ICON
// ------------------------------------------------------------

const selectedStationIcon = L.divIcon({
  className: 'ev-selected-station-marker',
  html: `
    <div
      style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #16a34a;
        border: 4px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        font-weight: bold;
      "
    >
      ⚡
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ------------------------------------------------------------
// CANDIDATE AREA ICON
// ------------------------------------------------------------

const candidateIcon = L.divIcon({
  className: 'ev-candidate-marker',
  html: `
    <div
      style="
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #f59e0b;
        border: 4px solid white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        font-weight: bold;
      "
    >
      +
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// ------------------------------------------------------------
// MAP CONTROLLER
// ------------------------------------------------------------

const MapController = ({
  coordinates,
  route,
  candidateArea,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!coordinates) {
      return;
    }

    map.panTo(
      [coordinates.latitude, coordinates.longitude],
      {
        animate: true,
        duration: 0.8,
      }
    );
  }, [
    coordinates?.latitude,
    coordinates?.longitude,
    map,
  ]);

  useEffect(() => {
    if (
      !route ||
      !route.geometry ||
      !Array.isArray(route.geometry.coordinates) ||
      route.geometry.coordinates.length === 0
    ) {
      return;
    }

    const routeCoordinates =
      route.geometry.coordinates.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ]
      );

    if (routeCoordinates.length > 1) {
      const bounds =
        L.latLngBounds(routeCoordinates);

      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [route, map]);

  useEffect(() => {
    if (!candidateArea) {
      return;
    }

    const latitude =
      Number(candidateArea.latitude);

    const longitude =
      Number(candidateArea.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    // Do not automatically zoom aggressively.
    // Just ensure the candidate point is visible.
    map.panTo(
      [latitude, longitude],
      {
        animate: true,
        duration: 0.6,
      }
    );
  }, [
    candidateArea?.latitude,
    candidateArea?.longitude,
    map,
  ]);

  return null;
};

// ------------------------------------------------------------
// ROUTE DISPLAY
// ------------------------------------------------------------

const RouteDisplay = ({ route }) => {
  const routeCoordinates = useMemo(() => {
    if (
      !route ||
      !route.geometry ||
      !Array.isArray(
        route.geometry.coordinates
      )
    ) {
      return [];
    }

    return route.geometry.coordinates.map(
      ([longitude, latitude]) => [
        latitude,
        longitude,
      ]
    );
  }, [route]);

  if (routeCoordinates.length === 0) {
    return null;
  }

  return (
    <>
      {/* White outline for route visibility */}
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: '#ffffff',
          weight: 9,
          opacity: 0.95,
        }}
      />

      {/* Main route */}
      <Polyline
        positions={routeCoordinates}
        pathOptions={{
          color: '#2563eb',
          weight: 5,
          opacity: 0.95,
        }}
      />
    </>
  );
};

// ------------------------------------------------------------
// SAFE NUMBER HELPER
// ------------------------------------------------------------

const safeNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

const ChargingMap = ({
  coordinates = null,
  stations = [],
  selectedStation = null,
  route = null,
  navigationActive = false,
  candidateArea = null,
}) => {
  // ----------------------------------------------------------
  // DEFAULT CENTER
  // ----------------------------------------------------------

  const defaultCenter = [
    16.5062,
    80.6480,
  ];

  const userPosition = useMemo(() => {
    if (!coordinates) {
      return null;
    }

    const latitude =
      safeNumber(coordinates.latitude);

    const longitude =
      safeNumber(coordinates.longitude);

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return [
      latitude,
      longitude,
    ];
  }, [coordinates]);

  // ----------------------------------------------------------
  // CANDIDATE LOCATION
  // ----------------------------------------------------------

  const candidatePosition = useMemo(() => {
    if (!candidateArea) {
      return null;
    }

    const latitude =
      safeNumber(candidateArea.latitude);

    const longitude =
      safeNumber(candidateArea.longitude);

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return [
      latitude,
      longitude,
    ];
  }, [candidateArea]);

  // ----------------------------------------------------------
  // SEARCH RADIUS
  // ----------------------------------------------------------

  const searchRadius = 25000;

  // ----------------------------------------------------------
  // STATION MARKERS
  // ----------------------------------------------------------

  const stationMarkers = useMemo(() => {
    if (!Array.isArray(stations)) {
      return [];
    }

    return stations
      .map((station) => {
        const address =
          station?.AddressInfo || {};

        const latitude =
          safeNumber(address.Latitude);

        const longitude =
          safeNumber(address.Longitude);

        if (
          latitude === null ||
          longitude === null
        ) {
          return null;
        }

        return {
          station,
          latitude,
          longitude,
        };
      })
      .filter(Boolean);
  }, [stations]);

  // ----------------------------------------------------------
  // SELECTED STATION POSITION
  // ----------------------------------------------------------

  const selectedStationPosition =
    useMemo(() => {
      if (!selectedStation) {
        return null;
      }

      const address =
        selectedStation.AddressInfo || {};

      const latitude =
        safeNumber(address.Latitude);

      const longitude =
        safeNumber(address.Longitude);

      if (
        latitude === null ||
        longitude === null
      ) {
        return null;
      }

      return [
        latitude,
        longitude,
      ];
    }, [selectedStation]);

  // ----------------------------------------------------------
  // MAP CENTER
  // ----------------------------------------------------------

  const mapCenter =
    userPosition ||
    candidatePosition ||
    defaultCenter;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
      style={{
        height: '520px',
      }}
    >
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* ==================================================
            OPEN STREET MAP
        ================================================== */}

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ==================================================
            MAP CONTROLLER
        ================================================== */}

        <MapController
          coordinates={coordinates}
          route={route}
          candidateArea={candidateArea}
        />

        {/* ==================================================
            USER SEARCH RADIUS
        ================================================== */}

        {userPosition && (
          <Circle
            center={userPosition}
            radius={searchRadius}
            pathOptions={{
              color: '#2563eb',
              weight: 1,
              opacity: 0.25,
              fillColor: '#2563eb',
              fillOpacity: 0.04,
            }}
          />
        )}

        {/* ==================================================
            USER LOCATION
        ================================================== */}

        {userPosition && (
          <Marker
            position={userPosition}
            icon={userIcon}
          >
            <Popup>
              <div>
                <strong>Your Location</strong>

                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                  }}
                >
                  Current GPS position
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ==================================================
            ROUTE
        ================================================== */}

        <RouteDisplay route={route} />

        {/* ==================================================
            ALL STATION MARKERS
        ================================================== */}

        {stationMarkers.map(
          ({
            station,
            latitude,
            longitude,
          }) => {
            const isSelected =
              selectedStation?.ID ===
              station?.ID;

            const address =
              station?.AddressInfo || {};

            const stationName =
              address.Title ||
              'Charging Station';

            const stationAddress =
              address.AddressLine1 ||
              'Address unavailable';

            const operational =
              station?.StatusType
                ?.IsOperational;

            const distance =
              safeNumber(address.Distance);

            const connections =
              Array.isArray(
                station?.Connections
              )
                ? station.Connections.length
                : 0;

            return (
              <Marker
                key={
                  station?.ID ||
                  `${latitude}-${longitude}`
                }
                position={[
                  latitude,
                  longitude,
                ]}
                icon={
                  isSelected
                    ? selectedStationIcon
                    : L.Icon.Default.prototype
                }
              >
                <Popup>
                  <div
                    style={{
                      minWidth: '190px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '14px',
                        marginBottom: '6px',
                      }}
                    >
                      {stationName}
                    </div>

                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '8px',
                      }}
                    >
                      {stationAddress}
                    </div>

                    {distance !== null && (
                      <div
                        style={{
                          fontSize: '12px',
                          marginBottom: '4px',
                        }}
                      >
                        📍{' '}
                        {distance.toFixed(1)} km
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '12px',
                        marginBottom: '4px',
                      }}
                    >
                      ⚡ {connections}{' '}
                      connectors
                    </div>

                    {typeof operational ===
                      'boolean' && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: operational
                            ? '#16a34a'
                            : '#dc2626',
                          fontWeight: 600,
                        }}
                      >
                        {operational
                          ? 'Operational'
                          : 'Not confirmed operational'}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}

        {/* ==================================================
            SELECTED DESTINATION
        ================================================== */}

        {selectedStationPosition && (
          <Marker
            position={
              selectedStationPosition
            }
            icon={selectedStationIcon}
          >
            <Popup>
              <div>
                <strong>
                  {selectedStation
                    ?.AddressInfo?.Title ||
                    'Charging Station'}
                </strong>

                <div
                  style={{
                    marginTop: '5px',
                    fontSize: '12px',
                    color: '#64748b',
                  }}
                >
                  Navigation destination
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ==================================================
            CANDIDATE NEW STATION AREA
        ================================================== */}

        {candidatePosition && (
          <>
            <Circle
              center={candidatePosition}
              radius={500}
              pathOptions={{
                color: '#f59e0b',
                weight: 2,
                opacity: 0.9,
                fillColor: '#f59e0b',
                fillOpacity: 0.16,
                dashArray: '8 6',
              }}
            />

            <Marker
              position={candidatePosition}
              icon={candidateIcon}
            >
              <Popup>
                <div
                  style={{
                    minWidth: '210px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '14px',
                      marginBottom: '6px',
                      color: '#b45309',
                    }}
                  >
                    Potential New Station Area
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.5,
                    }}
                  >
                    This area has been identified
                    for further charging
                    infrastructure investigation
                    based on distance,
                    infrastructure pressure,
                    and ML demand context.
                  </div>

                  {candidateArea?.score !==
                    undefined && (
                    <div
                      style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      Candidate Score:{' '}
                      {candidateArea.score}/100
                    </div>
                  )}

                  {candidateArea?.nearestStationDistanceKm !==
                    undefined && (
                    <div
                      style={{
                        marginTop: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Nearest Station:{' '}
                      {Number(
                        candidateArea.nearestStationDistanceKm
                      ).toFixed(1)}{' '}
                      km
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* ====================================================
          MAP LEGEND
      ==================================================== */}

      <div
        className="
          absolute
          left-4
          bottom-4
          z-[1000]
          rounded-xl
          border
          border-slate-200
          bg-white/95
          shadow-lg
          px-4
          py-3
          text-xs
          text-slate-700
        "
      >
        <div className="font-semibold mb-2">
          Map Legend
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background: '#2563eb',
            }}
          />
          <span>Your Location</span>
        </div>

        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background: '#16a34a',
            }}
          />
          <span>Selected Station</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background: '#f59e0b',
            }}
          />
          <span>Potential New Station Area</span>
        </div>
      </div>

      {/* ====================================================
          NAVIGATION STATUS
      ==================================================== */}

      {navigationActive && (
        <div
          className="
            absolute
            top-4
            left-1/2
            -translate-x-1/2
            z-[1000]
            rounded-full
            bg-blue-600
            text-white
            px-4
            py-2
            shadow-lg
            text-xs
            font-semibold
          "
        >
          Live Navigation Active
        </div>
      )}
    </div>
  );
};

export default ChargingMap;