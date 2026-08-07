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
import { useState, useEffect } from "react";
import NextDepartures from "@/component/features/NextDepartures";
import RouteTimeline from "@/component/features/RouteTimeline";
import ScheduleHeader from "@/component/head/ScheduleHeader";
import BusScheduleTable from "@/component/table/BusScheduleTable";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { fetchApi, SchedulesResponse, ScheduleData } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-100 w-full items-center justify-center rounded-2xl border border-border bg-muted text-sm text-muted-foreground">
      Loading map...
    </div>
  ),
});

const Page = () => {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScheduleData | null>(null);
  
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string>("");

  useEffect(() => {
    fetchApi<SchedulesResponse>("/schedules")
      .then((data) => {
        if (data.success && data.schedules) setSchedules(data.schedules);
      })
      .catch((err) => console.error("Failed to load schedules:", err))
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(schedule: ScheduleData) {
    setSelected((prev) => (prev?._id === schedule._id ? null : schedule));
  }

  const route = selected?.route;

  // Filter logic
  const filteredSchedules = schedules.filter(schedule => {
    const routeMatch = selectedRouteId ? schedule.route?._id === selectedRouteId : true;
    return routeMatch;
  });

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
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
          />
          <BusScheduleTable
            schedules={filteredSchedules}
            loading={loading}
            onSelectSchedule={handleSelect}
            selectedId={selected?._id ?? null}
          />
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-1/3">
          {selected && route ? (
            <>
              <div className="relative rounded-xl border border-border bg-card p-5 shadow-sm transition-colors">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm ${
                      route.color || "bg-primary text-primary-foreground"
                    }`}
                  >
                    {route.routeNo}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      Route {route.routeNo}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatRouteName(route.from, route.to)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bus className="h-4 w-4" />
                    <span>
                      Bus:{" "}
                      <span className="font-medium text-foreground">
                        {selected.bus?.busNumber}
                      </span>
                    </span>
                  </div>
                  {route.via && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Via:{" "}
                        <span className="font-medium text-foreground">
                          {route.via}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selected.firstBus} — {selected.lastBus} (
                      {selected.frequency})
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border shadow-md">
                <MapView
                  routeCoordinates={route.pathCoordinates || []}
                  routeLabel={`Route ${route.routeNo}: ${formatRouteName(route.from, route.to)}`}
                  fullScreen={false}
                />
              </div>

              <div className="rounded-xl border border-border bg-card shadow-sm transition-colors">
                <RouteTimeline
                  stops={route.stops}
                  firstBus={selected.firstBus}
                />
              </div>
            </>
          ) : (
            <>
              {!loading && <NextDepartures schedules={filteredSchedules} />}
              <RouteTimeline />
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="text-2xl text-primary" />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      Download Full Schedule
                    </h4>
                    <p className="text-xs text-muted-foreground">PDF Format</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-card text-primary transition-colors hover:bg-muted"
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
