"use client";

import { useState, useEffect, useMemo } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), { ssr: false });
import TrackingSidebar from "@/component/admin/TrackingSidebar";
import BusDetails from "@/component/LiveTracking/BusDetails";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import {
  fetchAllRouteStops,
  fetchStopsByRoute,
  getRouteWaypoints,
  isTrackingFresh,
  type NamedStop,
  type RouteStopRecord,
} from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

export default function Page() {
  const {
    routes,
    tracking,
    loadingTracking,
    routesError,
    trackingError,
  } = useLiveTracking();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState("");
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStopRecord[]>([]);

  useEffect(() => {
    fetchAllRouteStops()
      .then(setRouteStops)
      .catch((error) => console.error("Failed to load stop search data:", error));
  }, []);

  // Prefer a bus with a recent location, but keep stale buses selectable.
  useEffect(() => {
    if (!selectedId && tracking.length > 0) {
      setSelectedId(
        tracking.find((item) => isTrackingFresh(item))?._id ?? tracking[0]._id,
      );
    }
  }, [tracking, selectedId]);

  const activeTracking =
    tracking.find((t) => t._id === selectedId) ?? tracking[0];
  const activeRoute = activeTracking
    ? routes.find((r) => r._id === (typeof activeTracking.route === 'string' ? activeTracking.route : activeTracking.route?._id))
    : undefined;
  
  const activeRouteCoords = activeRoute?.pathCoordinates || [];

  useEffect(() => {
    if (!activeRoute?._id) {
      setNamedStops([]);
      return;
    }
    let mounted = true;
    setNamedStops([]);
    fetchStopsByRoute(activeRoute._id)
      .then((data) => {
        if (mounted) setNamedStops(data?.stops || []);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [activeRoute?._id]);

  const stopNamesByRoute = useMemo(
    () =>
      Object.fromEntries(
        routeStops.map((record) => [
          record.routeId,
          record.stops.map((stop) => stop.name),
        ]),
      ),
    [routeStops],
  );

  const mapCenter: [number, number] | undefined = activeTracking
    ? [activeTracking.latitude, activeTracking.longitude]
    : activeRouteCoords.length > 0
    ? activeRouteCoords[0]
    : undefined;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRouteFilter = (route: string) => {
    if (route !== "All Routes" && route !== "All Buses") {
      const selectedR = routes.find(
        (r) => r.routeNo === route || formatRouteName(r.from, r.to) === route,
      );
      if (selectedR) {
        const busOnRoute = tracking.find(t => {
          const tRouteId = typeof t.route === 'string' ? t.route : t.route?._id;
          return tRouteId === selectedR._id;
        });
        if (busOnRoute) {
          setSelectedId(busOnRoute._id);
        }
      }
    } else {
      setSelectedDirection("");
    }
  };

  return (
    <TrackLayout>
      <BusSearchHeader
        searchTitle="Find your bus"
        searchPlaceholder="Search bus number, route or stop"
        onSearch={handleSearch}
        onRouteFilter={handleRouteFilter}
        onSecondFilter={(value) => {
          const direction = value === "All Directions" ? "" : value;
          setSelectedDirection(direction);
          if (direction) {
            const matchingBus = tracking.find(
              (item) => item.direction === direction,
            );
            if (matchingBus) setSelectedId(matchingBus._id);
          }
        }}
        onViewMap={() =>
          document
            .getElementById("tracking-map")
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        routes={routes}
      />
      {(routesError || trackingError) && (
        <div
          role="alert"
          className="mx-4 mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger sm:mx-5"
        >
          {trackingError && <>Bus locations could not be loaded: {trackingError}</>}
          {trackingError && routesError && <br />}
          {routesError && <>Route information could not be loaded: {routesError}</>}
        </div>
      )}
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="w-full lg:w-[42%]">
          {loadingTracking ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-card shadow-md animate-pulse">
              <span className="text-muted-foreground font-medium">Loading bus locations…</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="lg:h-[25rem]">
                <TrackingSidebar
                  tracking={tracking}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  hideSearch={true}
                  externalSearch={searchQuery}
                  stopNamesByRoute={stopNamesByRoute}
                  selectedDirection={selectedDirection}
                  naturalHeight
                />
              </div>
              {activeTracking && (
                <div className="shrink-0">
                  <BusDetails tracking={activeTracking} />
                </div>
              )}
            </div>
          )}
        </div>
        <div id="tracking-map" className="h-[22rem] w-full sm:h-[30rem] lg:h-[38rem] lg:flex-1">
          <MapView
            center={mapCenter}
            routeCoordinates={activeRouteCoords}
            routeLabel={
              activeRoute ? formatRouteName(activeRoute.from, activeRoute.to) : undefined
            }
            showBus={!!activeTracking}
            busPosition={
              activeTracking
                ? [activeTracking.latitude, activeTracking.longitude]
                : undefined
            }
            busName={activeTracking?.bus?.busNumber || "Bus"}
            speed={activeTracking?.speed}
            eta={activeTracking?.eta}
            nextStop={activeTracking?.nextStop}
            direction={activeTracking?.direction}
            status={
              activeTracking && isTrackingFresh(activeTracking)
                ? activeTracking.status || "Live"
                : "Location unavailable"
            }
            locationFresh={
              activeTracking ? isTrackingFresh(activeTracking) : false
            }
            namedStops={
              namedStops.length > 0 ? namedStops : getRouteWaypoints(activeRoute)
            }
            stopETAs={activeTracking?.stopETAs}
            otherBuses={tracking.filter(
              (item) =>
                item._id !== activeTracking?._id && isTrackingFresh(item),
            )}
          />
        </div>
      </div>

      <Stats />
    </TrackLayout>
  );
}
