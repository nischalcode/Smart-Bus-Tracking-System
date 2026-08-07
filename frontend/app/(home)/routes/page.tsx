"use client";

import { useEffect, useState } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";

const MapView = dynamic(
  () => import("@/component/LiveTracking/MapView"),
  { ssr: false }
);

import RouteSidebar from "@/component/LiveTracking/RouteSidebar";
import RouteDetails from "@/component/features/RouteDetails";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { fetchStopsByRoute, NamedStop } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";
import { useLiveTracking } from "@/hooks/useLiveTracking";

export default function Page() {
  const { routes, tracking, loadingRoutes } = useLiveTracking();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("All Routes");
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);

  const activeRoute = routes[selectedIndex];

  useEffect(() => {
    if (!activeRoute?._id) return;
    fetchStopsByRoute(activeRoute._id)
      .then((data) => { setNamedStops(data?.stops || []); })
      .catch(console.error);
  }, [activeRoute?._id]);
  
  const activeRouteCoords = activeRoute?.pathCoordinates || [];

  const mapCenter =
    activeRouteCoords.length > 0
      ? activeRouteCoords[0]
      : undefined;

  const sidebarRoutes = routes.map((r, idx) => ({
    number: r.routeNo,
    route: formatRouteName(r.from, r.to),
    frequency: `Every ${r.frequency}`,
    status: r.status,
    color: r.color || "bg-primary text-white",
    active: idx === selectedIndex,
  }));
  
  const handleRouteFilter = (route: string) => {
    setSelectedRouteFilter(route);
    if (route !== "All Routes") {
      const idx = routes.findIndex(
        (r) => r.routeNo === route || formatRouteName(r.from, r.to) === route
      );
      if (idx >= 0) setSelectedIndex(idx);
    }
  };

  const handleSearch = (query: string) => {
  setSearchQuery(query);
  };

  return (
    <TrackLayout>
      <BusSearchHeader
        searchTitle="Search Routes"
        searchPlaceholder="Enter route number or route name"
        tileFirst="Select Route"
        firstOption="All Routes"
        titleSecond="Sort by"
        secondOption="Route Number"
        // routes={routes}
        // onRouteFilter={handleRouteFilter}
        onSearch={handleSearch}
        onRouteFilter={handleRouteFilter}
        onViewMap={() => setShowFullScreen(true)}
        routes={routes}
      />

      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        {loadingRoutes ? (
          <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-border bg-card shadow-sm lg:w-1/3 animate-pulse">
            <span className="text-muted-foreground font-medium">
              Loading Routes...
            </span>
          </div>
        ) : (
          <RouteSidebar
            routes={sidebarRoutes}
            title="Available Routes"
            description="Select a route to view its details."
            showSearch={false}
            onSelect={setSelectedIndex}
          />
        )}

        <div className="w-full lg:w-2/3 min-h-[500px] flex flex-col gap-3">
          {activeRoute && (
            <div className="shrink-0">
              <RouteDetails route={activeRoute} tracking={tracking} namedStops={namedStops} />
            </div>
          )}
          <div className="flex-1 min-h-[350px] overflow-hidden rounded-2xl border border-border">
            <MapView
              center={mapCenter}
              routeCoordinates={activeRouteCoords}
              routeLabel={
                activeRoute
                  ? formatRouteName(activeRoute.from, activeRoute.to)
                  : undefined
              }
              namedStops={namedStops}
              showBus={false}
            />
          </div>
        </div>
      </div>

      <Stats />
    </TrackLayout>
  );
}