"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { useEffect, useState } from "react";
import { fetchRoadRoute } from "@/utils/routing";
import { initLeafletIcons } from "@/utils/leaflet";

// Fits map to show the full route polyline
const FitBounds = ({ positions }: { positions: LatLngExpression[] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions as any, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
};

// Center map on bus position, keep current zoom
const CenterOnBus = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Zoom controls
const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-6 z-[999] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100 transition-colors"
      >
        <Plus size={18} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100 transition-colors"
      >
        <Minus size={18} />
      </button>
      <button
        onClick={() => map.setView(defaultCenter, 14)}
        className="rounded-lg bg-white p-2 shadow hover:bg-gray-100 transition-colors"
      >
        <Home size={18} />
      </button>
    </div>
  );
};

interface MapViewProps {
  center?: [number, number];
  routeCoordinates?: [number, number][];
  busPosition?: [number, number];
  busName?: string;
  routeLabel?: string;
  eta?: string;
  speed?: number;
  nextStop?: string;
  showBus?: boolean;
  fullScreen?: boolean;
}

const defaultCenter: [number, number] = [27.7172, 85.324];

const MapView = ({
  center = defaultCenter,
  routeCoordinates = [],
  busPosition,
  busName = "Bus",
  routeLabel = "Route Path",
  eta = "N/A",
  speed = 0,
  nextStop = "N/A",
  showBus = false,
  fullScreen = false,
}: MapViewProps) => {
  useEffect(() => {
    initLeafletIcons();
  }, []);

  const [roadPath, setRoadPath] = useState<LatLngExpression[] | null>(null);

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

  const routePolyline: LatLngExpression[] = (
    roadPath ??
    routeCoordinates.map(
      (coord) => [coord[0], coord[1]] as LatLngExpression
    )
  );

  // Use a stable key for bus marker so it re-renders when position changes
  const busKey = busPosition
    ? `${busPosition[0].toFixed(6)},${busPosition[1].toFixed(6)}`
    : "bus";

  return (
    <div className={`relative overflow-hidden ${fullScreen ? "h-full w-full" : "h-[600px] w-full rounded-2xl border border-gray-200 shadow-md lg:w-2/3"}`}>
      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit bounds when route has points, or center on bus */}
        {showBus && busPosition ? (
          <CenterOnBus center={busPosition} />
        ) : routePolyline.length >= 2 ? (
          <FitBounds positions={routePolyline} />
        ) : (
          <CenterOnBus center={center} />
        )}

        <ZoomControls />

        {routePolyline.length > 0 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: "#22c55e",
              weight: 6,
            }}
          />
        )}

        {/* Draw Markers for stops */}
        {routeCoordinates.map((stop, index) => (
          <Marker
            key={`stop-${index}`}
            position={[stop[0], stop[1]] as LatLngExpression}
          >
            <Popup>Stop {index + 1}</Popup>
          </Marker>
        ))}

        {/* Draw Live Bus Position Marker */}
        {showBus && busPosition && (
          <Marker
            key={busKey}
            position={[busPosition[0], busPosition[1]] as LatLngExpression}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="font-semibold">{busName}</h3>
                <p>{routeLabel}</p>
                <p className="text-primary">{eta}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {showBus && (
        <div className="absolute left-5 top-5 z-[999] w-64 rounded-xl bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{busName}</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              LIVE
            </span>
          </div>

          <p className="mb-2 text-sm text-gray-500">{routeLabel}</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Next Stop</span>
              <span className="font-medium">{nextStop}</span>
            </div>

            <div className="flex justify-between">
              <span>Status</span>
              <span className="text-primary">{eta}</span>
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
