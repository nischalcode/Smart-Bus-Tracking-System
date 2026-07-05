
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
} from "react-leaflet";
import { useEffect } from "react";


const center: [number, number] = [27.7172, 85.324];

const route: LatLngExpression[] = [
  [27.7172, 85.324],
  [27.7205, 85.329],
  [27.724, 85.334],
  [27.727, 85.341],
];

const busPosition: [number, number] = [27.724, 85.334];

const MapView = () => {
    useEffect(() => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
      
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
      }, []);
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-md lg:w-2/3">
      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline
          positions={route}
          pathOptions={{
            color: "#22c55e",
            weight: 6,
          }}
        />

        {route.map((stop, index) => (
          <Marker key={index} position={stop as [number, number]}>
            <Popup>Bus Stop {index + 1}</Popup>
          </Marker>
        ))}

        <Marker position={busPosition}>
          <Popup>
            <div className="space-y-1">
              <h3 className="font-semibold">Bus 12A</h3>

              <p>City Center → Airport</p>

              <p className="text-primary">2 min away</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Live Info Card */}

      <div className="absolute left-5 top-5 z-999 w-64 rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Bus 12A</h2>

          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
            LIVE
          </span>
        </div>

        <p className="mb-2 text-sm text-gray-500">City Center → Airport</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Next Stop</span>
            <span className="font-medium">Green Street</span>
          </div>

          <div className="flex justify-between">
            <span>Status</span>
            <span className="text-primary">2 min away</span>
          </div>

          <div className="flex justify-between">
            <span>Speed</span>
            <span>32 km/h</span>
          </div>
        </div>
      </div>

      {/* Fake Controls */}

      <div className="absolute bottom-6 right-6 z-999 flex flex-col gap-2">
        <button className="rounded-lg bg-white p-2 shadow">
          <Plus size={18} />
        </button>

        <button className="rounded-lg bg-white p-2 shadow">
          <Minus size={18} />
        </button>

        <button className="rounded-lg bg-white p-2 shadow">
          <Home size={18} />
        </button>
      </div>
    </div>
  );
};

export default MapView;
