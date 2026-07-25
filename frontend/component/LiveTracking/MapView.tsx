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
  Tooltip,
  useMap,
} from "react-leaflet";
import { useEffect, useRef, useState } from "react";
import { fetchRoadRoute } from "@/utils/routing";
import { initLeafletIcons } from "@/utils/leaflet";

const busIcon = L.divIcon({
  html: `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:42px;
      height:42px;
      border-radius:9999px;
      background:#2563eb;
      color:white;
      font-size:24px;
      box-shadow:0 6px 18px rgba(0,0,0,0.25);
      border:2px solid white;
    ">
      🚌
    </div>
  `,
  className: "",
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function createBusIcon(color: string) {
  return L.divIcon({
    html: `
      <div style="
        display:flex;
        align-items:center;
        justify-content:center;
        width:42px;
        height:42px;
        border-radius:9999px;
        background:${color};
        color:white;
        font-size:24px;
        box-shadow:0 6px 18px rgba(0,0,0,0.25);
        border:2px solid white;
      ">
        🚌
      </div>
    `,
    className: "",
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

const routeColors = ["0", "60", "120", "180", "240", "300"];

function createStartIcon(label: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;white-space:nowrap;">
        <div style="width:22px;height:22px;border-radius:50%;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
        </div>
        <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#16a34a;color:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div>
      </div>
    `,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createEndIcon(label: string) {
  return L.divIcon({
    html: `
      <div style="position:relative;white-space:nowrap;">
        <div style="width:22px;height:22px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
        </div>
        <div style="position:absolute;top:-28px;left:50%;transform:translateX(-50%);background:#dc2626;color:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${label}</div>
      </div>
    `,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function createStopIcon(name: string, index: number) {
  return L.divIcon({
    html: `
      <div style="position:relative;white-space:nowrap;">
        <div style="width:16px;height:16px;border-radius:50%;background:white;border:3px solid #2563eb;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;color:#2563eb;">${index}</div>
        <div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:white;color:#374151;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);border:1px solid #e5e7eb;">${name}</div>
      </div>
    `,
    className: "",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

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
// Fit All Buses
// ==========================
const FitAllBuses = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as any, {
        padding: [60, 60],
      });
    } else if (positions.length === 1) {
      map.setView(positions[0], 14);
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
    <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100"
      >
        <Plus size={18} />
      </button>

      <button
        onClick={() => map.zoomOut()}
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100"
      >
        <Minus size={18} />
      </button>

      <button
        onClick={() =>
          map.flyTo(deviceLocation ?? defaultCenter, 16)
        }
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100"
      >
        <Home size={18} />
      </button>
    </div>
  );
};

export interface BusMarker {
  id: string;
  position: [number, number];
  name: string;
  routeLabel?: string;
  eta?: string;
  speed?: number;
  nextStop?: string;
  colorIndex?: number;
  driverName?: string;
  status?: string;
}

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
  eta?: string;
  speed?: number;
  nextStop?: string;
  showBus?: boolean;
  fullScreen?: boolean;
  autoSize?: boolean;

  buses?: BusMarker[];
  showAllBuses?: boolean;
}

const MapView = ({
  center = defaultCenter,
  routeCoordinates = [],
  namedStops = [],
  busPosition,
  busName = "Bus",
  routeLabel = "Route",
  eta = "N/A",
  speed = 0,
  nextStop = "N/A",
  showBus = false,
  fullScreen = false,
  autoSize = true,
  buses = [],
  showAllBuses = false,
}: MapViewProps) => {
  useEffect(() => {
    initLeafletIcons();
  }, []);

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
        console.error(error);
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

  const allBusPositions = showAllBuses
    ? buses.map((b) => b.position)
    : [];

  return (
    <div
      className={`relative z-0 overflow-hidden ${
        fullScreen
          ? "h-full w-full"
          : autoSize
            ? "h-150 w-full rounded-2xl border shadow lg:w-2/3"
            : "h-full w-full"
      }`}
    >
      <MapContainer
        center={center}
        zoom={showAllBuses && allBusPositions.length > 1 ? 12 : 15}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showAllBuses && allBusPositions.length >= 2 ? (
          <FitAllBuses positions={allBusPositions} />
        ) : namedStops.length >= 2 ? (
          <FitBounds
            positions={namedStops.map((s) => [s.lat, s.lng] as LatLngExpression)}
          />
        ) : showBus && busPosition ? (
          <CenterOnBus center={busPosition} />
        ) : null}

        <ZoomControls deviceLocation={deviceLocation} />

        {namedStops.length >= 2 && routePolyline.length >= 2 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#2563eb",
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}

        {namedStops.map((stop, index) => {
          const isFirst = index === 0;
          const isLast = index === namedStops.length - 1;
          const icon = isFirst
            ? createStartIcon(stop.name)
            : isLast
              ? createEndIcon(stop.name)
              : createStopIcon(stop.name, index);

          return (
            <Marker key={`stop-${index}`} position={[stop.lat, stop.lng]} icon={icon}>
              <Popup>
                <div className="text-sm">
                  <span className="font-semibold">{stop.name}</span>
                  {isFirst && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">START</span>}
                  {isLast && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">END</span>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {showAllBuses &&
          buses.map((bus) => (
            <Marker
              key={bus.id}
              position={bus.position}
              icon={createBusIcon(routeColors[bus.colorIndex ?? 0])}
            >
              <Tooltip
                direction="top"
                offset={[0, -20]}
                opacity={1}
                permanent={false}
                className="!rounded-xl !border-0 !p-0 !shadow-lg"
              >
                <div className="min-w-[200px] rounded-xl bg-white p-3 shadow-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm text-gray-900">{bus.name}</h3>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                      LIVE
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Driver</span>
                      <span className="font-medium text-gray-900">{bus.driverName || "Unassigned"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Destination</span>
                      <span className="font-medium text-gray-900">{bus.routeLabel || "No route"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Next Stop</span>
                      <span className="font-medium text-gray-900">{bus.nextStop || "N/A"}</span>
                    </div>
                    {bus.speed !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Speed</span>
                        <span className="font-medium text-gray-900">{bus.speed} km/h</span>
                      </div>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Marker>
          ))}

        {!showAllBuses && showBus && busPosition && (
          <Marker
            key={busKey}
            position={busPosition}
            icon={busIcon}
          >
            <Popup>
              <div>
                <h3 className="font-bold">{busName}</h3>
                <p>{routeLabel}</p>
                <p>{eta}</p>
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
        <div className="absolute left-5 bottom-5 z-20 w-72 rounded-xl bg-white p-4 shadow-xl border">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">
              📍 Current Device Location
            </h2>

            <span className="text-green-600 font-semibold text-sm">
              LIVE
            </span>
          </div>

          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Latitude</span>
              <span className="font-medium">
                {deviceLocation[0].toFixed(6)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Longitude</span>
              <span className="font-medium">
                {deviceLocation[1].toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
