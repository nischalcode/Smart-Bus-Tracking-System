"use client";

import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { Dispatch, SetStateAction } from "react";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

interface RouteMapPickerProps {
  value: [number, number][];
  onChange: Dispatch<SetStateAction<[number, number][]>>;
}

const defaultCenter: [number, number] = [27.7172, 85.324];

// Fix Leaflet marker icons
if ((L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl) {
  delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({
  onChange,
}: {
  onChange: Dispatch<SetStateAction<[number, number][]>>;
}) {
  useMapEvents({
    click(e) {
      onChange((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
    },
  });

  return null;
}

function FitBounds({ value }: { value: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (value.length < 2) return;
    const bounds = L.latLngBounds(value.map((p) => [p[0], p[1]]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, value]);

  return null;
}

export default function RouteMapPicker({
  value,
  onChange,
}: RouteMapPickerProps) {
  const undo = () => {
    onChange((prev) => prev.slice(0, -1));
  };

  const clear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Route Builder</h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={value.length === 0}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={clear}
            disabled={value.length === 0}
            className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Click anywhere on the map to create a route.
      </p>

      <div className="overflow-hidden rounded-xl border">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="h-[420px] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ClickHandler onChange={onChange} />
          <FitBounds value={value} />

          {value.length > 1 && (
            <Polyline
              positions={value}
              pathOptions={{
                color: "#16a34a",
                weight: 5,
              }}
            />
          )}

          {value.map((point, index) => {
            let label = `Stop ${index + 1}`;

            if (index === 0) label = "Start";

            if (index === value.length - 1 && value.length > 1)
              label = "Destination";

            return (
              <Marker
                key={`${point[0].toFixed(6)}-${point[1].toFixed(6)}`}
                position={point}
              >
                <Popup>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{label}</h3>
                    <p>
                      <strong>Latitude:</strong> {point[0].toFixed(6)}
                    </p>
                    <p>
                      <strong>Longitude:</strong> {point[1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div>
        <label htmlFor="route-coords" className="mb-2 block font-medium">
          Coordinates
        </label>
        <textarea
          id="route-coords"
          readOnly
          value={JSON.stringify(value, null, 2)}
          rows={8}
          className="w-full rounded-lg border bg-gray-50 p-3 text-sm font-mono"
        />
      </div>
    </div>
  );
}
