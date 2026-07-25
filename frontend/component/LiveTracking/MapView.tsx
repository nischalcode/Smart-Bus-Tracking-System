"use client";

import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import { Home, Minus, Plus } from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, useRef, useState, useMemo } from "react";
import { fetchRoadRoute } from "@/utils/routing";
import { initLeafletIcons } from "@/utils/leaflet";
import {
  haversineDistanceMeters,
  calculateETA,
  formatDistance,
  formatETA,
} from "@/utils/geo";
const busIcon = L.divIcon({
  html: `
    <div style="
      font-size:30px;
    ">
      🚌
    </div>
  `,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
// ==========================
// Fit Route
// ==========================
const FitBounds = ({ positions }: { positions: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as any, {
        padding: [40, 40],
      });
    }
  }, [positions, map]);

  return null;
};


// ==========================
// Center On Bus
// ==========================
const CenterOnBus = ({
  center,
}: {
  center: [number, number];
}) => {
  const map = useMap();

  useEffect(() => {
    map.panTo(center);
  }, [center, map]);

  return null;
};

// ==========================
// Follow Device Location
// ==========================
const FollowDevice = ({
  location,
}: {
  location: [number, number] | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo(location, map.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [location, map]);

  return null;
};

// ==========================
// Zoom Controls
// ==========================
const defaultCenter: [number, number] = [27.7172, 85.324];

const ZoomControls = ({
  deviceLocation,
}: {
  deviceLocation: [number, number] | null;
}) => {
  const map = useMap();

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="rounded-lg bg-card text-card-foreground p-2 shadow hover:bg-muted"
      >
        <Plus size={18} />
      </button>

      <button
        onClick={() => map.zoomOut()}
        className="rounded-lg bg-card text-card-foreground p-2 shadow hover:bg-muted"
      >
        <Minus size={18} />
      </button>

      <button
        onClick={() =>
          map.flyTo(deviceLocation ?? defaultCenter, 16)
        }
        className="rounded-lg bg-card text-card-foreground p-2 shadow hover:bg-muted"
      >
        <Home size={18} />
      </button>
    </div>
  );
};

interface MapViewProps {
  center?: [number, number];
  routeCoordinates?: [number, number][];

  namedStops?: {
    name: string;
    lat: number;
    lng: number;
  }[];

  busPosition?: [number, number];
  busName?: string;
  routeLabel?: string;
  speed?: number;
  nextStop?: string | null;
  currentStop?: string | null;
  previousStop?: string | null;
  eta?: number | null; // ETA in minutes
  distanceToNextStop?: number | null; // Distance in meters
  showBus?: boolean;
  fullScreen?: boolean;
}

const MapView = ({
  center = defaultCenter,
  routeCoordinates = [],
  namedStops = [],
  busPosition,
  busName = "Bus",
  routeLabel = "Route",
  eta = null,
  speed = 0,
  nextStop = null,
  currentStop = null,
  previousStop = null,
  distanceToNextStop = null,
  showBus = false,
  fullScreen = false,
}: MapViewProps) => {
  
  useEffect(() => {
    initLeafletIcons();
  }, []);

  const [roadPath, setRoadPath] =
    useState<LatLngExpression[] | null>(null);
  const [roadRouteAttempted, setRoadRouteAttempted] = useState(false);

  const [deviceLocation, setDeviceLocation] =
    useState<[number, number] | null>(null);

  const watchId = useRef<number | null>(null);

  // ==========================
  // Watch Device GPS
  // ==========================
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      (error) => {
        console.warn("Geolocation error:", error.message || error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // ==========================
  // Road Route
  // ==========================
  useEffect(() => {
    if (routeCoordinates.length < 2) {
      setRoadPath(null);
      setRoadRouteAttempted(true);
      return;
    }

    setRoadRouteAttempted(false);
    let cancelled = false;

    fetchRoadRoute(routeCoordinates).then((road) => {
      if (cancelled) return;
      setRoadPath(
        road ? road.map((c) => [c[0], c[1]] as LatLngExpression) : null
      );
      setRoadRouteAttempted(true);
    });

    return () => {
      cancelled = true;
    };
  }, [routeCoordinates]);

  // Only use road-snapped path once OSRM has been attempted.
  // Before that, show nothing to prevent doubled/broken lines.
  const routePolyline = !roadRouteAttempted
    ? []
    : roadPath ??
      routeCoordinates.map(
        (coord) => [coord[0], coord[1]] as LatLngExpression
      );

  // Memoize per-stop distance and ETA from bus position
  const stopDistances = useMemo(() => {
    if (!busPosition || namedStops.length === 0) return new Map<string, { distMeters: number; etaMinutes: number | null }>();
    const map = new Map<string, { distMeters: number; etaMinutes: number | null }>();
    for (const stop of namedStops) {
      const distMeters = haversineDistanceMeters(busPosition[0], busPosition[1], stop.lat, stop.lng);
      const etaMinutes = calculateETA(distMeters / 1000, speed ?? 0);
      map.set(stop.name, { distMeters, etaMinutes });
    }
    return map;
  }, [busPosition, namedStops, speed]);

  const busKey = busPosition
    ? `${busPosition[0]},${busPosition[1]}`
    : "bus";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow ${
        fullScreen ? "h-full w-full" : "h-full w-full min-h-[400px]"
      }`}
      style={{ height: "100%", width: "100%" }}
    >
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* <FollowDevice location={deviceLocation} /> */}

        {showBus && busPosition ? (
          <CenterOnBus center={busPosition} />
        ) : routePolyline.length >= 2 ? (
          <FitBounds positions={routePolyline} />
        ) : null}

        <ZoomControls deviceLocation={deviceLocation} />

        {routePolyline.length > 0 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#22c55e",
              weight: 6,
            }}
          />
        )}

        {namedStops.map((stop, index) => {
          const stopInfo = stopDistances.get(stop.name);
          const isNextStop = stop.name === nextStop;
          const isCurrentStop = stop.name === currentStop;
          const isPreviousStop = stop.name === previousStop;
          return (
            <Marker
              key={`stop-${index}`}
              position={[stop.lat, stop.lng]}
            >
              <Popup>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{stop.name}</h4>
                  {isCurrentStop && (
                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                      Current Stop
                    </span>
                  )}
                  {isNextStop && (
                    <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                      Next Stop
                    </span>
                  )}
                  {isPreviousStop && (
                    <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                      Previous Stop
                    </span>
                  )}
                  {stopInfo && showBus && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Distance: {formatDistance(stopInfo.distMeters)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ETA: {formatETA(stopInfo.etaMinutes)}
                      </p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {showBus && busPosition && (
        <Marker
          key={busKey}
          position={busPosition}
          icon={busIcon}
        >
          <Popup>
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">{busName}</h3>
              <p className="text-sm text-muted-foreground">{routeLabel}</p>
              {previousStop && (
                <p className="text-xs text-muted-foreground">
                  <strong>Previous:</strong> {previousStop}
                </p>
              )}
              {currentStop && (
                <p className="text-xs text-muted-foreground">
                  <strong>Current:</strong> {currentStop}
                </p>
              )}
              {nextStop && (
                <p className="text-xs text-muted-foreground">
                  <strong>Next:</strong> {nextStop}
                </p>
              )}
              {distanceToNextStop !== null && (
                <p className="text-xs text-muted-foreground">
                  <strong>Distance:</strong> {formatDistance(distanceToNextStop)}
                </p>
              )}
              {eta !== null && (
                <p className="text-xs text-muted-foreground">
                  <strong>ETA:</strong> {formatETA(eta)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                <strong>Speed:</strong> {speed?.toFixed(1) ?? 0} km/h
              </p>
            </div>
          </Popup>
        </Marker>
        )}
          
        

        {/* Device Location */}
        {deviceLocation && (
          <Marker position={deviceLocation}>
            <Popup>
              <div className="space-y-1">
                <h3 className="font-semibold">📍 Your Current Location</h3>

                <p>
                  <strong>Latitude:</strong>{" "}
                  {deviceLocation[0].toFixed(6)}
                </p>

                <p>
                  <strong>Longitude:</strong>{" "}
                  {deviceLocation[1].toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      {deviceLocation && (
        <div className="absolute left-5 bottom-5 z-20 w-72 rounded-xl bg-card text-card-foreground p-4 shadow-xl border">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              📍 Current Device Location
            </h2>

            <span className="text-success font-semibold text-sm">
              LIVE
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Latitude</span>
              <span className="font-medium text-foreground">
                {deviceLocation[0].toFixed(6)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Longitude</span>
              <span className="font-medium text-foreground">
                {deviceLocation[1].toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      )}

      {showBus && (
        <div className="absolute left-5 top-5 z-20 w-72 rounded-xl bg-card text-card-foreground p-4 shadow-xl border">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-foreground">{busName}</h2>

            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              LIVE
            </span>
          </div>

          <p className="mb-3 text-sm text-muted-foreground">
            {routeLabel}
          </p>

          <div className="space-y-2 border-t pt-3 text-sm">
            {previousStop && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Stop</span>
                <span className="font-medium text-foreground">{previousStop}</span>
              </div>
            )}

            {currentStop && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Stop</span>
                <span className="font-medium text-foreground">{currentStop}</span>
              </div>
            )}

            {nextStop && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Stop</span>
                <span className="font-medium text-foreground">{nextStop}</span>
              </div>
            )}

            {distanceToNextStop !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium text-foreground">
                  {formatDistance(distanceToNextStop)}
                </span>
              </div>
            )}

            {eta !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">ETA</span>
                <span className="font-medium text-foreground">
                  {formatETA(eta)}
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Speed</span>
              <span className="font-medium text-foreground">{speed?.toFixed(1) ?? 0} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;