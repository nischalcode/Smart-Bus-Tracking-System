"use client";

import {
  ArrowRight,
  Bus,
  Clock,
  Download,
  FileText,
  MapPin,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import NextDepartures from "@/component/features/NextDepartures";
import RouteTimeline from "@/component/features/RouteTimeline";
import ScheduleHeader from "@/component/head/ScheduleHeader";
import BusScheduleTable from "@/component/table/BusScheduleTable";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { fetchApi, type ScheduleData, type SchedulesResponse } from "@/utils/api";

const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-100 w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

const Page = () => {
  const [selected, setSelected] = useState<ScheduleData | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  function handleSelect(schedule: ScheduleData) {
    setSelected((prev) => (prev?._id === schedule._id ? null : schedule));
  }

  async function handleDownloadSchedule() {
    try {
      const data = await fetchApi<SchedulesResponse>("/schedules?limit=1000");
      if (!data.success || !data.schedules?.length) return;

      const headers = ["Route No", "From", "To", "Via", "Bus Number", "First Bus", "Last Bus", "Frequency", "Status"];
      const rows = data.schedules.map((s) => [
        s.route?.routeNo ?? "",
        s.route?.from ?? "",
        s.route?.to ?? "",
        s.route?.via ?? "",
        s.bus?.busNumber ?? "",
        s.firstBus ?? "",
        s.lastBus ?? "",
        s.frequency ?? "",
        s.status ?? "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "smartbus-full-schedule.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download schedule:", err);
    }
  }

  const route = selected?.route;

  return (
    <TrackLayout>
      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex w-full flex-col gap-3 lg:w-2/3">
          <ScheduleHeader
            selectedRouteId={selectedRouteId}
            onRouteChange={(routeId) => {
              setSelectedRouteId(routeId);
              setSelected(null);
            }}
          />
          <BusScheduleTable
            onSelectSchedule={handleSelect}
            selectedId={selected?._id ?? null}
            routeFilterId={selectedRouteId}
          />
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-1/3">
          {selected && route ? (
            <>
              <div className="relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                      route.color || "bg-green-600 text-white"
                    }`}
                  >
                    {route.routeNo}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Route {route.routeNo}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {route.from} <ArrowRight className="inline h-3 w-3" />{" "}
                      {route.to}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bus className="h-4 w-4" />
                    <span>
                      Bus:{" "}
                      <span className="font-medium text-gray-900">
                        {selected.bus?.busNumber || "—"}
                      </span>
                    </span>
                  </div>
                  {route.via && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Via:{" "}
                        <span className="font-medium text-gray-900">
                          {route.via}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selected.firstBus} — {selected.lastBus} (
                      {selected.frequency})
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Status</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        selected.status === "On Time"
                          ? "bg-green-50 text-green-700"
                          : selected.status === "Delays"
                            ? "bg-red-50 text-red-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Active</span>
                    <span
                      className={`text-xs font-medium ${
                        selected.active ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {selected.active ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[300px] lg:h-[400px] rounded-2xl border border-gray-200 shadow-md overflow-hidden">
                <MapView
                  routeCoordinates={route.pathCoordinates || []}
                  routeLabel={`Route ${route.routeNo}: ${route.from} → ${route.to}`}
                  fullScreen={false}
                  autoSize={false}
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <RouteTimeline
                  stops={route.stops}
                  firstBus={selected.firstBus}
                />
              </div>
            </>
          ) : (
            <>
              <NextDepartures />
              <RouteTimeline />
              <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-2xl text-green-600" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Download Full Schedule
                    </h4>
                    <p className="text-xs text-gray-500">PDF Format</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSchedule}
                  className="flex h-8 w-8 items-center justify-center rounded border border-green-200 bg-white text-green-600 transition-colors hover:bg-green-100"
                >
                  <Download className="text-sm" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </TrackLayout>
  );
};

export default Page;
