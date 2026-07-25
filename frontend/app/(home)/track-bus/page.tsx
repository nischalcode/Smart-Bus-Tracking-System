"use client";

import { useState, useMemo } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), { ssr: false });
const FullScreenMap = dynamic(() => import("@/component/LiveTracking/FullScreenMap"), { ssr: false });
import RouteSidebar from "@/component/LiveTracking/RouteSidebar";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { useLiveTracking } from "@/hooks/useLiveTracking";

export default function Page() {
  const { routes, loadingRoutes, trackingByRouteId, trackingByBusId } = useLiveTracking();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("All Routes");
  const [showFullScreen, setShowFullScreen] = useState(false);

  const activeRoute = routes[selectedIndex];
  const activeRouteCoords = activeRoute?.pathCoordinates || [];
  const activeTracking = activeRoute
    ? trackingByRouteId.get(activeRoute._id)
    : undefined;

  const mapCenter: [number, number] | undefined = activeTracking
    ? [activeTracking.latitude, activeTracking.longitude]
    : activeRouteCoords.length > 0
    ? activeRouteCoords[0]
    : undefined;

  const allBusMarkers = useMemo(() => {
    const markers: {
      id: string;
      position: [number, number];
      name: string;
      routeLabel?: string;
      eta?: string;
      speed?: number;
      nextStop?: string;
      colorIndex?: number;
    }[] = [];

    trackingByBusId.forEach((t, busId) => {
      const routeId = typeof t.route === "string" ? t.route : t.route?._id;
      const routeIndex = routes.findIndex((r) => r._id === routeId);
      markers.push({
        id: busId,
        position: [t.latitude, t.longitude],
        name: t.busNo || t.bus?.busNumber || "Bus",
        routeLabel: t.routeName || (routeIndex >= 0 ? `${routes[routeIndex].from} → ${routes[routeIndex].to}` : undefined),
        eta: t.eta,
        speed: t.speed,
        nextStop: t.nextStop,
        colorIndex: routeIndex >= 0 ? routeIndex % 6 : 0,
      });
    });

    return markers;
  }, [trackingByBusId, routes]);

  const sidebarRoutes = useMemo(() => {
    return routes.map((r, idx) => {
      const t = trackingByRouteId.get(r._id);
      let statusText = r.status;
      if (t) {
        statusText = t.status || r.status;
      }
      return {
        number: r.routeNo,
        route: `${r.from} → ${r.to}`,
        frequency: `Every ${r.frequency}`,
        status: statusText,
        color: r.color || "bg-primary text-white",
        active: idx === selectedIndex,
        hasTracking: !!t,
      };
    });
  }, [routes, selectedIndex, trackingByRouteId]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRouteFilter = (route: string) => {
    setSelectedRouteFilter(route);
    if (route !== "All Routes") {
      const idx = routes.findIndex(
        (r) => r.routeNo === route || `${r.from} → ${r.to}` === route
      );
      if (idx >= 0) setSelectedIndex(idx);
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
      <div className="flex flex-col gap-4 p-5 lg:flex-row">
        {loadingRoutes ? (
          <div className="flex h-150 w-full items-center justify-center rounded-2xl bg-white shadow-md lg:w-1/3 animate-pulse">
            <span className="text-gray-500 font-medium">Loading Routes...</span>
          </div>
        ) : (
          <RouteSidebar
            routes={sidebarRoutes}
            title="Available Routes"
            description="Select a route to display its path and stops on the map."
            showSearch={true}
            onSelect={setSelectedIndex}
            searchQuery={searchQuery}
          />
        )}

        <MapView
          center={mapCenter}
          routeCoordinates={activeRouteCoords}
          routeLabel={
            activeRoute ? `${activeRoute.from} → ${activeRoute.to}` : undefined
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
          buses={allBusMarkers}
          showAllBuses={true}
        />
      </div>

      <Stats />

      {showFullScreen && (
        <FullScreenMap
          onClose={() => setShowFullScreen(false)}
          initialRouteIndex={selectedIndex}
        />
      )}
    </TrackLayout>
  );
}
