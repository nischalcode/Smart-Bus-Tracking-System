"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const BusSearchHeader = dynamic(() => import("@/component/head/BusSearchHeader"), { ssr: false });
const MapView = dynamic(() => import("@/component/LiveTracking/MapView"), { ssr: false });
import RouteSidebar from "@/component/LiveTracking/RouteSidebar";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { fetchApi, RoutesResponse, RouteData, NamedStop } from "@/utils/api";

function extractStops(route: RouteData | undefined): NamedStop[] {
  if (!route?.stops) return [];
  return route.stops
    .filter((s) => typeof s.lat === "number" && typeof s.lng === "number")
    .map((s) => ({ name: s.name, lat: s.lat!, lng: s.lng!, type: s.type }));
}

const Page = () => {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("All Areas");

  useEffect(() => {
    fetchApi<RoutesResponse>("/routes")
      .then((data) => {
        if (data.success && data.routes) {
          setRoutes(data.routes);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load routes from API:", err);
        setLoading(false);
      });
  }, []);

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

  const sidebarRoutes = filteredRoutes.map((r) => {
    const idx = routes.indexOf(r);
    return {
      number: r.routeNo,
      route: `${r.from} → ${r.to}`,
      frequency: `Every ${r.frequency}`,
      status: r.status,
      color: r.color || "bg-primary text-white",
      active: idx === selectedIndex,
    };
  });

  const activeRoute = routes[selectedIndex];
  const activeCoordinates = activeRoute?.pathCoordinates || [];
  const mapCenter = activeCoordinates.length > 0 ? activeCoordinates[0] : undefined;

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
        {loading ? (
          <div className="flex h-[600px] w-full items-center justify-center rounded-2xl bg-white shadow-md lg:w-1/3 animate-pulse">
            <span className="text-gray-500 font-medium">Loading Routes...</span>
          </div>
        ) : (
          <RouteSidebar 
            routes={sidebarRoutes}
            title="Available Routes"
            description="Select a route to display its path and stops on the map."
            showSearch={false}
            onSelect={setSelectedIndex}
          />
        )}
        <MapView 
          center={mapCenter} 
          routeCoordinates={activeCoordinates}
          namedStops={extractStops(activeRoute)}
          routeLabel={activeRoute ? `${activeRoute.from} → ${activeRoute.to}` : undefined}
        />
      </div>
      <Stats />
    </TrackLayout>
  );
};

export default Page;