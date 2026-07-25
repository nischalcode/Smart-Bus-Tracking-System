"use client";

import { useState, useMemo } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), { ssr: false });
import RouteSidebar from "@/component/LiveTracking/RouteSidebar";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { useLiveTracking } from "@/hooks/useLiveTracking";

const Page = () => {
  const { routes, loadingRoutes, trackingByRouteId, trackingByBusId } = useLiveTracking();
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("All Areas");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRouteFilter = (route: string) => {
    setSelectedRouteFilter(route);
    if (route !== "All Areas") {
      const idx = routes.findIndex(
        (r) => r.routeNo === route || `${r.from} → ${r.to}` === route
      );
      if (idx >= 0) setSelectedIndex(idx);
    }
  };

  const filteredRoutes = routes.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.routeNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedRouteFilter === "All Areas" ||
      r.routeNo === selectedRouteFilter ||
      `${r.from} → ${r.to}` === selectedRouteFilter;
    return matchesSearch && matchesFilter;
  });

  const hasRouteSelected = selectedIndex >= 0 && selectedIndex < routes.length;

  const activeRoute = hasRouteSelected ? routes[selectedIndex] : undefined;
  const activeRouteCoords = activeRoute?.pathCoordinates || [];
  const activeTracking = activeRoute
    ? trackingByRouteId.get(activeRoute._id)
    : undefined;

  const mapCenter: [number, number] | undefined = activeTracking
    ? [activeTracking.latitude, activeTracking.longitude]
    : activeRouteCoords.length > 0
    ? activeRouteCoords[0]
    : undefined;

  const namedStops = useMemo(() => {
    if (!activeRoute) return [];
    return (activeRoute.stops || [])
      .filter((s) => s.lat !== undefined && s.lng !== undefined)
      .map((s) => ({
        name: s.name,
        lat: s.lat!,
        lng: s.lng!,
      }));
  }, [activeRoute]);

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
    const list = hasRouteSelected ? filteredRoutes : filteredRoutes;
    return list.map((r) => {
      const idx = routes.indexOf(r);
      const t = trackingByRouteId.get(r._id);
      return {
        number: r.routeNo,
        route: `${r.from} → ${r.to}`,
        frequency: `Every ${r.frequency}`,
        status: t?.status || r.status,
        color: r.color || "bg-primary text-white",
        active: idx === selectedIndex,
        hasTracking: !!t,
      };
    });
  }, [filteredRoutes, routes, selectedIndex, trackingByRouteId, hasRouteSelected]);

  const selectedBusForRoute = useMemo(() => {
    if (!activeTracking) return undefined;
    return [
      {
        id: activeTracking.busId || activeTracking.bus?._id || "bus",
        position: [activeTracking.latitude, activeTracking.longitude] as [number, number],
        name: activeTracking.busNo || activeTracking.bus?.busNumber || "Bus",
        routeLabel: `${activeRoute?.from} → ${activeRoute?.to}`,
        eta: activeTracking.eta,
        speed: activeTracking.speed,
        nextStop: activeTracking.nextStop,
        colorIndex: 0,
      },
    ];
  }, [activeTracking, activeRoute]);

  return (
    <TrackLayout>
      <BusSearchHeader
        routes={routes}
        onSearch={handleSearch}
        onRouteFilter={handleRouteFilter}
        tileFirst="Filter by Areas"
        firstOption="All Areas"
        titleSecond="Sort by"
        secondOption="Route Number"
      />
      <div className="flex gap-4 p-5 flex-col lg:flex-row">
        {loadingRoutes ? (
          <div className="flex h-[600px] w-full items-center justify-center rounded-2xl bg-white shadow-md lg:w-1/3 animate-pulse">
            <span className="text-gray-500 font-medium">Loading Routes...</span>
          </div>
        ) : (
          <RouteSidebar
            routes={sidebarRoutes}
            title={hasRouteSelected ? "Route Details" : "Available Routes"}
            description={
              hasRouteSelected
                ? `${activeRoute?.from} → ${activeRoute?.to} • Every ${activeRoute?.frequency}`
                : "Select a route to see its path and live bus movement."
            }
            showSearch={false}
            onSelect={setSelectedIndex}
          />
        )}
        <MapView
          center={mapCenter}
          routeCoordinates={hasRouteSelected ? activeRouteCoords : []}
          namedStops={hasRouteSelected ? namedStops : []}
          routeLabel={activeRoute ? `${activeRoute.from} → ${activeRoute.to}` : undefined}
          showBus={hasRouteSelected && !!activeTracking}
          busPosition={
            hasRouteSelected && activeTracking
              ? [activeTracking.latitude, activeTracking.longitude]
              : undefined
          }
          busName={activeTracking?.bus?.busNumber || "Bus"}
          speed={activeTracking?.speed}
          eta={activeTracking?.eta}
          nextStop={activeTracking?.nextStop}
          buses={hasRouteSelected ? (selectedBusForRoute || []) : allBusMarkers}
          showAllBuses={!hasRouteSelected}
        />
      </div>
      <Stats />
    </TrackLayout>
  );
};

export default Page;
