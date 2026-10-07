"use client";

import {
  Bus,
  Clock,
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
import { fetchStopsByRoute } from "@/utils/api";
import {
  fetchApi,
  getRouteWaypoints,
  isTrackingFresh,
  type NamedStop,
  type ScheduleData,
  type SchedulesResponse,
  type TrackingData,
  type TrackingResponse,
} from "@/utils/api";
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
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingData[]>([]);
  const [trackingUnavailable, setTrackingUnavailable] = useState(false);
  const [selected, setSelected] = useState<ScheduleData | null>(null);
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);
  
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([
      fetchApi<SchedulesResponse>("/schedules?limit=100"),
      fetchApi<TrackingResponse>("/tracking"),
    ]).then(([scheduleResult, trackingResult]) => {
      if (!mounted) return;
      if (scheduleResult.status === "fulfilled") {
        if (scheduleResult.value.success) {
          setSchedules(scheduleResult.value.schedules || []);
        } else {
          setError("The schedule service returned an unsuccessful response.");
        }
      } else {
        setError(
          scheduleResult.reason instanceof Error
            ? scheduleResult.reason.message
            : "Unable to load schedules.",
        );
      }
      if (trackingResult.status === "fulfilled") {
        setTracking(trackingResult.value.tracking || []);
      } else {
        console.error("Failed to load live bus directions:", trackingResult.reason);
        setTrackingUnavailable(true);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selected?.route?._id) {
      setNamedStops([]);
      return;
    }
    let mounted = true;
    setNamedStops([]);
    fetchStopsByRoute(selected.route._id)
      .then((data) => {
        if (mounted) setNamedStops(data?.stops || []);
      })
      .catch((fetchError) => console.error("Failed to load schedule route stops:", fetchError));
    return () => {
      mounted = false;
    };
  }, [selected?.route?._id]);

  function handleSelect(schedule: ScheduleData) {
    setSelected((prev) => (prev?._id === schedule._id ? null : schedule));
  }

  const route = selected?.route;

  // Filter logic
  const filteredSchedules = schedules
    .filter((schedule) => {
      const routeMatch = selectedRouteId
        ? schedule.route?._id === selectedRouteId
        : true;
      if (!routeMatch || !selectedDirection) return routeMatch;
      const scheduleBusId =
        typeof schedule.bus === "string" ? schedule.bus : schedule.bus?._id;
      const busDirection = tracking.find((item) => {
        const trackingBusId =
          typeof item.bus === "string" ? item.bus : item.bus?._id;
        const trackingRouteId =
          typeof item.route === "string" ? item.route : item.route?._id;
        return (
          trackingBusId === scheduleBusId &&
          trackingRouteId === schedule.route?._id &&
          isTrackingFresh(item)
        );
      })?.direction;
      return busDirection === selectedDirection;
    })
    .sort((a, b) => a.firstBus.localeCompare(b.firstBus));

  const selectedTracking = selected
    ? tracking.find((item) => {
        const busId =
          typeof item.bus === "string" ? item.bus : item.bus?._id;
        return busId === selected.bus?._id && isTrackingFresh(item);
      })
    : undefined;
  const routeBuses = selected
    ? tracking.filter((item) => {
        const routeId =
          typeof item.route === "string" ? item.route : item.route?._id;
        return routeId === selected.route?._id && isTrackingFresh(item);
      })
    : [];

  return (
    <TrackLayout>
      <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5 lg:flex-row">
        <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-[2]">
          <ScheduleHeader
            selectedRouteId={selectedRouteId}
            onRouteChange={(routeId) => {
              setSelectedRouteId(routeId);
              setSelected(null);
            }}
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
          />
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
            >
              Unable to load schedules: {error}
            </div>
          )}
          {selectedDirection && trackingUnavailable && (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
              Direction-specific schedule data is unavailable because live bus
              locations could not be loaded.
            </p>
          )}
          {selectedDirection && !trackingUnavailable && (
            <p className="text-xs text-muted-foreground">
              Direction is based on the current live direction of each bus.
              Schedules do not store a direction.
            </p>
          )}
          <BusScheduleTable
            schedules={filteredSchedules}
            loading={loading}
            error={error}
            onSelectSchedule={handleSelect}
            selectedId={selected?._id ?? null}
          />
        </div>

        <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-1">
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
                  namedStops={
                    namedStops.length > 0
                      ? namedStops
                      : getRouteWaypoints(route)
                  }
                  showBus={!!selectedTracking}
                  focusOnBus={false}
                  busPosition={
                    selectedTracking
                      ? [selectedTracking.latitude, selectedTracking.longitude]
                      : undefined
                  }
                  busName={selectedTracking?.bus?.busNumber}
                  direction={selectedTracking?.direction}
                  speed={selectedTracking?.speed}
                  eta={selectedTracking?.eta}
                  nextStop={selectedTracking?.nextStop}
                  status={selectedTracking?.status || "Location available"}
                  locationFresh={!!selectedTracking}
                  otherBuses={routeBuses.filter(
                    (item) => item._id !== selectedTracking?._id,
                  )}
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
              {!loading && !error && <NextDepartures schedules={filteredSchedules} />}
              {!selected && <RouteTimeline />}
            </>
          )}
        </div>
      </div>
    </TrackLayout>
  );
};

export default Page;
