"use client";

import L from "leaflet";
import type { LatLngExpression } from "leaflet";
import { Home, Minus, Plus } from "lucide-react";
import {
  MapContainer,
  Marker,
  CircleMarker,
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
      font-size:30px;
    ">
      🚌
    </div>
  `,
  className: "",
  iconSize: [30, 30],
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

interface MapViewProps {
  center?: [number, number];
  routeCoordinates?: [number, number][];

  namedStops?: {
    name: string;
    lat: number;
    lng: number;
    type?: "start" | "stop" | "end";
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
    if (!navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setDeviceLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      () => {},
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
          const stopType = stop.type || (index === 0 ? "start" : index === namedStops.length - 1 ? "end" : "stop");
          const color = stopType === "start" ? "#16a34a" : stopType === "end" ? "#dc2626" : "#2563eb";
          return (
            <CircleMarker
              key={`stop-${index}`}
              center={[stop.lat, stop.lng]}
              radius={8}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>
                <div style={{ fontSize: "13px" }}>
                  <strong>{stop.name}</strong><br />
                  <span style={{ textTransform: "capitalize", color: "#6b7280" }}>{stopType} stop</span>
                </div>
              </Popup>
              <Tooltip permanent direction="top" offset={[0, -10]}>
                <span style={{ fontWeight: 700, fontSize: "11px" }}>{stop.name}</span>
              </Tooltip>
            </CircleMarker>
          );
        })}
        {showBus && busPosition && (
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

      {showBus && (
        <div className="absolute left-5 top-5 z-20 w-64 rounded-xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{busName}</h2>

            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              LIVE
            </span>
          </div>

          <p className="mb-2 text-sm text-gray-500">
            {routeLabel}
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Next Stop</span>
              <span>{nextStop}</span>
            </div>

            <div className="flex justify-between">
              <span>Status</span>
              <span>{eta}</span>
            </div>

            <div className="flex justify-between">
              <span>Speed</span>
              <span>{speed} km/h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;