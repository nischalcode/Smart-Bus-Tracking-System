"use client";

import { useState, useEffect } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), { ssr: false });
const FullScreenMap = dynamic(() => import("@/component/LiveTracking/FullScreenMap"), { ssr: false });
import TrackingSidebar from "@/component/admin/TrackingSidebar";
import BusDetails from "@/component/LiveTracking/BusDetails";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import { fetchStopsByRoute, NamedStop } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

export default function Page() {
  const { routes, tracking, loadingTracking } = useLiveTracking();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);

  // Automatically select the first active bus if none is selected yet
  useEffect(() => {
    if (!selectedId && tracking.length > 0) {
      setSelectedId(tracking[0]._id);
    }
  }, [tracking, selectedId]);

  const activeTracking = tracking.find((t) => t._id === selectedId);
  const activeRoute = activeTracking
    ? routes.find((r) => r._id === (typeof activeTracking.route === 'string' ? activeTracking.route : activeTracking.route?._id))
    : undefined;
  
  const activeRouteCoords = activeRoute?.pathCoordinates || [];

  useEffect(() => {
    if (!activeRoute?._id) return;
    fetchStopsByRoute(activeRoute._id)
      .then((data) => { setNamedStops(data?.stops || []); })
      .catch(console.error);
  }, [activeRoute?._id]);

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
      const selectedR = routes.find(r => r.routeNo === route || formatRouteName(r.from, r.to) === route);
      if (selectedR) {
        const busOnRoute = tracking.find(t => {
          const tRouteId = typeof t.route === 'string' ? t.route : t.route?._id;
          return tRouteId === selectedR._id;
        });
        if (busOnRoute) {
          setSelectedId(busOnRoute._id);
        }
      }
    }
  };

  return (
    <TrackLayout>
      <BusSearchHeader
        onSearch={handleSearch}
        onRouteFilter={handleRouteFilter}
        onViewMap={() => setShowFullScreen(true)}
        routes={routes}
      />
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="flex h-[28rem] w-full flex-col md:h-[36rem] lg:flex-1">
          {loadingTracking ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl bg-white shadow-md animate-pulse">
              <span className="text-gray-500 font-medium">Loading Live Tracking...</span>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <TrackingSidebar
                  tracking={tracking}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  hideSearch={true}
                  externalSearch={searchQuery}
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
        <div className="h-[28rem] w-full md:h-[36rem] lg:flex-1">
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
            namedStops={namedStops}
            stopETAs={activeTracking?.stopETAs}
          />
        </div>
      </div>

      <Stats />

      {showFullScreen && (
        <FullScreenMap
          onClose={() => setShowFullScreen(false)}
          initialRouteIndex={activeRoute ? routes.indexOf(activeRoute) : 0}
        />
      )}
    </TrackLayout>
  );
}
