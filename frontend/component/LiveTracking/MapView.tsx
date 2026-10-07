"use client";

import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import { haversineKm, formatDistance, calculateETA } from "@/utils/haversine";
import { Home, Minus, Plus } from "lucide-react";
import {
  MapContainer,
  Marker,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchRoadRoute } from "@/utils/routing";
import { initLeafletIcons } from "@/utils/leaflet";
import type { TrackingData } from "@/utils/api";

const busIcon = (direction: string) => {
  const isComing = direction === "Coming";
  return L.divIcon({
    html: `
      <div style="
        font-size:30px;
        transform: scaleX(${isComing ? -1 : 1});
        display:inline-block;
      ">
        🚌
      </div>
    `,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Helper to format route label according to travel direction (Going vs Coming)
function formatRouteLabel(label: string): string {
  if (!label || label === "Route") return "Route";
  const separator = label.includes(" → ") ? " → " : label.includes(" - ") ? " - " : null;
  if (!separator) return label;

  const parts = label.split(separator);
  if (parts.length !== 2) return label;

  return `${parts[0].trim()} - ${parts[1].trim()}`;
}

// ==========================
// Fit Route
// ==========================
const FitBounds = ({ positions }: { positions: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), {
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
// Map Resize & Invalidate Handler
// Ensures Leaflet recalculates size on container/responsive changes
// ==========================
const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    const timer = setTimeout(handleResize, 150);

    const container = map.getContainer();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && container) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);

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
    <div className="absolute bottom-6 right-6 z-1000 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="rounded-lg bg-card text-card-foreground p-2 shadow hover:bg-muted"
      >
        <Plus size={18} />
      </button>

      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="rounded-lg bg-card text-card-foreground p-2 shadow hover:bg-muted"
      >
        <Minus size={18} />
      </button>

      <button
        type="button"
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

// ==========================
// MapView Props
// ==========================
interface MapViewProps {
  center?: [number, number];
  routeCoordinates?: [number, number][];

  namedStops?: {
    name: string;
    lat?: number;
    lng?: number;
  }[];

  busPosition?: [number, number];
  busName?: string;
  routeLabel?: string;
  direction?: string; // "Going" | "Coming"
  eta?: string;
  speed?: number;
  currentStop?: string;
  nextStop?: string;
  remainingDistance?: number;
  showBus?: boolean;
  fullScreen?: boolean;
  stopETAs?: { name: string; distance: number; eta: string }[];
  isDeviated?: boolean;
  deviationDistance?: number;
  status?: string;
  otherBuses?: TrackingData[];
  focusOnBus?: boolean;
  locationFresh?: boolean;
}

const MapView = ({
  center = defaultCenter,
  routeCoordinates = [],
  namedStops = [],
  busPosition,
  busName = "Bus",
  routeLabel = "Route",
  direction = "",
  eta,
  speed,
  currentStop = "",
  nextStop = "",
  remainingDistance,
  showBus = false,
  fullScreen = false,
  stopETAs: _stopETAs = [],
  isDeviated = false,
  deviationDistance = 0,
  status = "Location unavailable",
  otherBuses = [],
  focusOnBus = showBus,
  locationFresh = false,
}: MapViewProps) => {

  useEffect(() => {
    initLeafletIcons();
  }, []);

  const formattedRouteLabel = useMemo(() => {
    return formatRouteLabel(routeLabel);
  }, [routeLabel]);

  // Persistent ref to track progression through stops (never regresses)
  const progressionRef = useRef<{
    routeLabel: string;
    direction: string;
    nextIdx: number;
    wasArrived: boolean;
  }>({
    routeLabel,
    direction,
    nextIdx: 0,
    wasArrived: false,
  });

  // ==========================
  // Dynamic Geofencing & Direction-Aware Stop Progression (updates live with bus movement)
  // ==========================
  const dynamicStopData = useMemo(() => {
    if (
      progressionRef.current.routeLabel !== routeLabel ||
      progressionRef.current.direction !== direction
    ) {
      progressionRef.current = {
        routeLabel,
        direction,
        nextIdx: 0,
        wasArrived: false,
      };
    }
    if (!locationFresh || !busPosition || !namedStops || namedStops.length === 0) return null;

    // Filter stops that have non-empty name and valid GPS coordinates
    const validStops = namedStops.filter(
      (s): s is { name: string; lat: number; lng: number } =>
        Boolean(s) && Boolean(s.name) && typeof s.lat === "number" && typeof s.lng === "number"
    );
    if (validStops.length === 0) return null;

    // Order stops according to directional travel sequence
    const orderedStops = direction === "Coming" ? [...validStops].reverse() : [...validStops];

    // Compute distance to each stop
    const stopDistances = orderedStops.map((stop) => ({
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      distKm: haversineKm(busPosition, [stop.lat, stop.lng]),
    }));
    

    // Reset progression when stops or direction changes
    const progression = progressionRef.current;
    if (progression.nextIdx >= orderedStops.length) {
      progression.nextIdx = orderedStops.length - 1;
    }

    // Find the best nextIdx by scanning forward through stops.
    // Start from the persisted nextIdx, but if a stop ahead is significantly
    // closer than the current target, advance to it. This handles the case
    // where the bus is already past progression.nextIdx (e.g. telemetry started late).
    let nextStopIdx = progression.nextIdx;
    let bestDist = stopDistances[nextStopIdx]?.distKm ?? Infinity;

    for (let i = nextStopIdx + 1; i < orderedStops.length; i++) {
      const d = stopDistances[i].distKm;
      // If this stop is closer and the bus has clearly passed the previous one
      if (d < bestDist * 0.8 && d < 1) {
        nextStopIdx = i;
        bestDist = d;
        progression.wasArrived = false;
      }
    }

    // Also check if nextStopIdx itself is too far — look for the first stop
    // within 2km ahead, or the next one that is closer than the current.
    // This prevents sticking on a stop the bus has already passed.
    const distToTarget = stopDistances[nextStopIdx]?.distKm ?? Infinity;
    for (let i = nextStopIdx + 1; i < orderedStops.length; i++) {
      if (stopDistances[i].distKm < distToTarget * 0.5) {
        nextStopIdx = i;
        break;
      }
    }

    // Clamp and persist
    if (nextStopIdx !== progression.nextIdx) {
      progression.nextIdx = nextStopIdx;
    }

    let isArrived = false;
    let currentStopName = "";
    let currentStopIdx = -1;

    const currentTarget = orderedStops[nextStopIdx];
    const currentDist = currentTarget
      ? haversineKm(busPosition, [currentTarget.lat, currentTarget.lng])
      : Infinity;

    // 30m Geofencing Check (0.03 km)
    if (currentDist <= 0.03) {
      isArrived = true;
      currentStopIdx = nextStopIdx;
      currentStopName = orderedStops[nextStopIdx].name;
      progression.wasArrived = true;
    } else {
      isArrived = false;
      // If we were arrived and have left the geofence, advance to next stop
      if (progression.wasArrived && nextStopIdx + 1 < orderedStops.length) {
        nextStopIdx++;
        progression.nextIdx = nextStopIdx;
        progression.wasArrived = false;
      }
    }

    const targetNextStop = orderedStops[nextStopIdx];
    const targetNextDist = targetNextStop
      ? haversineKm(busPosition, [targetNextStop.lat, targetNextStop.lng])
      : 0;
    const nextStopDistanceStr = formatDistance(targetNextDist);
    const nextStopEtaStr = calculateETA(targetNextDist, speed ?? 0);

    // Build map of per-stop status for popups (passed / arrived / upcoming)
    const stopStatusMap = new Map<
      string,
      {
        statusType: "passed" | "arrived" | "upcoming";
        distanceStr: string;
        etaStr: string;
      }
    >();

    orderedStops.forEach((stop, idx) => {
      const distKm = stopDistances[idx].distKm;
      const distStr = formatDistance(distKm);
      const etaStr = calculateETA(distKm, speed ?? 0);

      if (isArrived && idx === currentStopIdx) {
        stopStatusMap.set(stop.name, {
          statusType: "arrived",
          distanceStr: "0 m",
          etaStr: "Arrived",
        });
      } else if (idx < nextStopIdx) {
        // Passed stop behind the bus in directional sequence
        stopStatusMap.set(stop.name, {
          statusType: "passed",
          distanceStr: distStr,
          etaStr: "No upcoming bus at this stop soon",
        });
      } else {
        // Upcoming stop ahead of the bus
        stopStatusMap.set(stop.name, {
          statusType: "upcoming",
          distanceStr: distStr,
          etaStr: etaStr,
        });
      }
    });

    return {
      isArrived,
      currentStopName: currentStop || currentStopName,
      nextStopName: nextStop || targetNextStop?.name || "Unavailable",
      nextStopDistance: nextStopDistanceStr,
      nextStopEta: nextStopEtaStr,
      stopStatusMap,
    };
  }, [busPosition, namedStops, speed, direction, routeLabel, currentStop, nextStop, locationFresh]);

  const [roadPath, setRoadPath] =
    useState<LatLngExpression[] | null>(null);

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
  // Road Route via OSRM
  // ==========================
  useEffect(() => {
    if (routeCoordinates.length < 2) {
      setRoadPath(null);
      return;
    }

    let cancelled = false;

    fetchRoadRoute(routeCoordinates).then((road) => {
      if (!cancelled && road) {
        setRoadPath(
          road.map((c) => [c[0], c[1]] as LatLngExpression)
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [routeCoordinates]);

  const routePolyline =
    roadPath ??
    routeCoordinates.map(
      (coord) =>
        [coord[0], coord[1]] as LatLngExpression
    );

  const busKey = busPosition
    ? `${busPosition[0]},${busPosition[1]}`
    : "bus";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow ${
        fullScreen ? "h-full w-full" : "h-full w-full min-h-[300px]"
      }`}
      style={{ height: "100%", width: "100%" }}
    >
      <MapContainer
        center={center}
        zoom={15}
        zoomControl={false}
        className="h-full w-full"
      >
        <MapResizeHandler />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showBus && busPosition && focusOnBus ? (
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

        {/* Stop Markers — direction-aware status & popups */}
        {namedStops.map((stop) => {
          if (typeof stop.lat !== "number" || typeof stop.lng !== "number") return null;
          const statusInfo = dynamicStopData?.stopStatusMap.get(stop.name);

          return (
            <Marker key={`${stop.name}-${stop.lat}-${stop.lng}`} position={[stop.lat, stop.lng]}>
              <Popup>
                <div className="space-y-1 min-w-[160px]">
                  <h3 className="font-bold text-base text-gray-900">{stop.name}</h3>
                  {statusInfo ? (
                    <div className="text-sm">
                      {statusInfo.statusType === "arrived" ? (
                        <div className="mt-1">
                          <span className="inline-block rounded bg-green-100 px-2 py-0.5 font-bold text-green-700 text-xs mb-1">
                            BUS ARRIVED
                          </span>
                          <p className="text-gray-600">Bus Distance: 0 m</p>
                        </div>
                      ) : statusInfo.statusType === "passed" ? (
                        <div className="mt-1 text-gray-500 font-medium">
                          <p className="text-xs bg-gray-100 p-1.5 rounded text-gray-600">
                            No upcoming bus at this stop soon
                          </p>
                        </div>
                      ) : (
                        <div className="text-gray-600 mt-1">
                          <p className="font-medium text-gray-800 mb-0.5">Bus Distance:</p>
                          <p>{statusInfo.distanceStr}</p>
                          <p className="font-medium text-gray-800 mt-2 mb-0.5">Arrival Time:</p>
                          <p>{statusInfo.etaStr}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Bus not active on this route</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {otherBuses.map((bus) => (
          <Marker
            key={bus._id}
            position={[bus.latitude, bus.longitude]}
            icon={busIcon(bus.direction || "Going")}
          >
            <Popup minWidth={160}>
              <div className="space-y-1 text-sm">
                <h3 className="font-bold">Bus: {bus.bus?.busNumber || "Bus"}</h3>
                <p>Route: {bus.route?.routeNo || "Route unavailable"}</p>
                <p>Direction: {bus.direction || "Unavailable"}</p>
                <p>Status: {bus.status || "Location available"}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Bus Marker — rich popup on click */}
        {showBus && busPosition && (
          <Marker
            key={busKey}
            position={busPosition}
            icon={busIcon(direction)}
          >
            <Popup minWidth={180}>
              <div className="space-y-1 text-sm">
                <h3 className="font-bold text-base">Bus: {busName}</h3>
                <p className="text-gray-500 font-medium">
                  Route: {formattedRouteLabel}
                </p>
                <p className="text-gray-500 font-medium">
                  Direction: {direction || "Going"}
                </p>
                <p className="text-gray-500 font-medium">
                Status: {status}
                </p>
                {isDeviated && (
                  <div className="rounded bg-red-100 p-1.5 text-xs font-bold text-red-700">
                    ⚠️ Route Deviation (~{deviationDistance || 100}m off route)
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  {dynamicStopData ? (
                    <>
                      <p>
                        <span className="font-semibold text-green-600">Current Stop: </span>
                        {dynamicStopData.currentStopName || "Unavailable"}
                      </p>
                      {dynamicStopData.isArrived ? (
                        <>
                          <p>
                            <span className="font-semibold text-green-600">Current Stop: </span>
                            {dynamicStopData.currentStopName}
                          </p>
                          <p className="text-xs text-green-600 font-semibold">Arrived (0 m)</p>
                        </>
                      ) : (
                        <>
                          <p>
                            <span className="font-semibold">Distance: </span>
                            {dynamicStopData.nextStopDistance} ({dynamicStopData.nextStopEta})
                          </p>
                          <p>
                            <span className="font-semibold">Next Stop: </span>
                            {dynamicStopData.nextStopName}
                          </p>
                        </>
                      )}
                    </>
                  ) : null}
                  <p>
                    <span className="font-semibold">Speed: </span>
                    {!locationFresh
                      ? "Unavailable"
                      : typeof speed === "number"
                        ? speed === 0
                          ? "Stopped"
                          : `${speed} km/h`
                        : "Unavailable"}
                  </p>
                  <p>
                    <span className="font-semibold">ETA: </span>
                    {locationFresh ? eta || "Unavailable" : "Unavailable"}
                  </p>
                  <p>
                    <span className="font-semibold">Remaining Distance: </span>
                    {locationFresh && typeof remainingDistance === "number"
                      ? formatDistance(remainingDistance)
                      : "Unavailable"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Device Location Marker */}
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

      {/* Device Location Overlay Card */}
      {deviceLocation && (
        <div className="absolute left-5 bottom-5 z-[1001] w-72 rounded-xl bg-card text-card-foreground p-4 shadow-xl border">
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

      {/* Bus Info Card — Top-Left Overlay */}
      {showBus && (
        <div className="absolute left-5 top-5 z-[1001] w-64 rounded-xl bg-card text-card-foreground p-4 shadow-xl border">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-foreground">Bus: {busName}</h2>
            <span
              className={`flex items-center gap-1 text-xs font-semibold ${
                locationFresh ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  locationFresh ? "live-dot bg-primary" : "bg-muted-foreground"
                }`}
              />
              {locationFresh ? status : "Location unavailable"}
            </span>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Route:</p>
              <p className="font-medium">{formattedRouteLabel}</p>
              <p className="mt-1 font-semibold text-foreground">Direction:</p>
              <p className="font-medium">{direction || "Unavailable"}</p>
            </div>

            {locationFresh && isDeviated && (
              <div className="rounded-lg bg-red-500/10 p-2 text-xs font-semibold text-red-600 border border-red-500/20">
                ⚠️ Off Assigned Route (~{deviationDistance || 100}m)
              </div>
            )}

            {dynamicStopData && (
              <>
                <div>
                  <p className="font-semibold text-green-600 dark:text-green-400">Current Stop:</p>
                  <p className="font-bold text-foreground">{dynamicStopData.currentStopName || "Unavailable"}</p>
                </div>
                {dynamicStopData.isArrived ? (
                  <div>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">Arrived (0 m)</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold text-foreground">Distance:</p>
                      <p>{dynamicStopData.nextStopDistance} ({dynamicStopData.nextStopEta})</p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">Next Stop:</p>
                      <p className="font-medium text-foreground">{dynamicStopData.nextStopName}</p>
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <p className="font-semibold text-foreground">Speed:</p>
              <p>
                {!locationFresh
                  ? "Unavailable"
                  : typeof speed === "number"
                    ? speed === 0
                      ? "Stopped"
                      : `${speed} km/h`
                    : "Unavailable"}
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">ETA:</p>
              <p>{locationFresh ? eta || "Unavailable" : "Unavailable"}</p>
            </div>

            <div>
              <p className="font-semibold text-foreground">Remaining Distance:</p>
              <p>{locationFresh && typeof remainingDistance === "number" ? formatDistance(remainingDistance) : "Unavailable"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
