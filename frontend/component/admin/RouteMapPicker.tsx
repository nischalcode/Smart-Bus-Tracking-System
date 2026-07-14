"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
} from "react-leaflet";

interface RouteMapPickerProps {
  value: [number, number][];
  onChange: (points: [number, number][]) => void;
}

const defaultCenter: [number, number] = [27.7172, 85.3240];

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({
  points,
  onChange,
}: {
  points: [number, number][];
  onChange: (p: [number, number][]) => void;
}) {
  useMapEvents({
    click(e) {
      onChange([
        ...points,
        [e.latlng.lat, e.latlng.lng],
      ]);
    },
  });

  return null;
}

export default function RouteMapPicker({
  value,
  onChange,
}: RouteMapPickerProps) {
  const undo = () => {
    if (value.length === 0) return;

    onChange(value.slice(0, -1));
  };

  const clear = () => {
    onChange([]);
  };

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          Route Builder
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-red-500 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
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

          <ClickHandler
            points={value}
            onChange={onChange}
          />

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
                key={index}
                position={point}
              >
                <Popup>
                  <div className="space-y-1">

                    <h3 className="font-semibold">
                      {label}
                    </h3>

                    <p>
                      <strong>Latitude:</strong>{" "}
                      {point[0].toFixed(6)}
                    </p>

                    <p>
                      <strong>Longitude:</strong>{" "}
                      {point[1].toFixed(6)}
                    </p>

                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div>

        <label className="mb-2 block font-medium">
          Coordinates
        </label>

        <textarea
          readOnly
          value={JSON.stringify(value, null, 2)}
          rows={8}
          className="w-full rounded-lg border bg-gray-50 p-3 text-sm font-mono"
        />

      </div>
    </div>
  );
}