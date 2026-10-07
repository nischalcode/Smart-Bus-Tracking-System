"use client";

import { useEffect, useMemo, useState } from "react";
import BusSearchHeader from "@/component/head/BusSearchHeader";
import dynamic from "next/dynamic";
import RouteSidebar from "@/component/LiveTracking/RouteSidebar";
import RouteDetails from "@/component/features/RouteDetails";
import Stats from "@/component/stats/Stats";
import TrackLayout from "@/component/track-layout/TrackLayout";
import {
  fetchStopsByRoute,
  getRouteWaypoints,
  isTrackingFresh,
  type NamedStop,
} from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";
import { useLiveTracking } from "@/hooks/useLiveTracking";

const MapView = dynamic(
  () => import("@/component/LiveTracking/MapView"),
  { ssr: false },
);

type RouteSort = "Route Number" | "Most Active Buses" | "Route Name";

export default function Page() {
  const {
    routes,
    tracking,
    loadingRoutes,
    routesError,
    trackingError,
  } = useLiveTracking();
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("");
  const [sortBy, setSortBy] = useState<RouteSort>("Route Number");
  const [namedStops, setNamedStops] = useState<NamedStop[]>([]);

  useEffect(() => {
    if (!selectedRouteId && routes.length > 0) {
      setSelectedRouteId(routes[0]._id);
    }
  }, [routes, selectedRouteId]);

  const activeRoute =
    routes.find((route) => route._id === selectedRouteId) ?? routes[0];
  const activeRouteBuses = useMemo(
    () =>
      tracking.filter((item) => {
        const routeId =
          typeof item.route === "string" ? item.route : item.route?._id;
        return routeId === activeRoute?._id && isTrackingFresh(item);
      }),
    [activeRoute?._id, tracking],
  );
  const selectedBus = activeRouteBuses[0];

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
      .catch((error) => console.error("Failed to load route stops:", error));

    return () => {
      mounted = false;
    };
  }, [activeRoute?._id]);

  const sidebarRoutes = useMemo(() => {
    const filtered = routes
      .map((route, index) => {
        const buses = tracking.filter((item) => {
          const routeId =
            typeof item.route === "string" ? item.route : item.route?._id;
          return routeId === route._id && isTrackingFresh(item);
        });
        return {
          number: route.routeNo,
          route: formatRouteName(route.from, route.to),
          frequency: route.frequency
            ? `Every ${route.frequency}`
            : "Frequency unavailable",
          status: buses.length > 0 ? `${buses.length} active` : route.status,
          color: route.color || "bg-primary text-white",
          active: route._id === activeRoute?._id,
          hasTracking: buses.length > 0,
          activeBusCount: buses.length,
          id: route._id,
          index,
        };
      })
      .filter((route) => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          route.number.toLowerCase().includes(query) ||
          route.route.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (!selectedRouteFilter || route.id === selectedRouteFilter)
        );
      });

    return filtered.sort((a, b) => {
      if (sortBy === "Most Active Buses") {
        return (b.activeBusCount ?? 0) - (a.activeBusCount ?? 0) ||
          a.number.localeCompare(b.number, undefined, { numeric: true });
      }
      if (sortBy === "Route Name") return a.route.localeCompare(b.route);
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [
    activeRoute?._id,
    routes,
    searchQuery,
    selectedRouteFilter,
    sortBy,
    tracking,
  ]);

  const handleRouteFilter = (routeNo: string) => {
    const selected = routes.find((route) => route.routeNo === routeNo);
    setSelectedRouteFilter(selected?._id ?? "");
    if (selected) setSelectedRouteId(selected._id);
  };

  return (
    <TrackLayout>
      <BusSearchHeader
        searchTitle="Search routes"
        searchPlaceholder="Enter a route number or route name"
        tileFirst="Filter by route"
        firstOption="All Routes"
        titleSecond="Sort by"
        secondOption="Route Number"
        secondOptions={["Most Active Buses", "Route Name"]}
        onSearch={setSearchQuery}
        onRouteFilter={handleRouteFilter}
        onSecondFilter={(value) => setSortBy(value as RouteSort)}
        onViewMap={() =>
          document
            .getElementById("routes-map")
            ?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        routes={routes}
      />
      {trackingError && (
        <output className="mx-4 mt-4 block rounded-xl bg-muted p-4 text-sm text-muted-foreground sm:mx-5">
          Live bus locations are unavailable. Route details and the route map
          remain available.
        </output>
      )}

      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row">
        <div className="w-full min-w-0 lg:w-[35%]">
          {loadingRoutes ? (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
              <span className="text-muted-foreground">Loading routes…</span>
            </div>
          ) : routesError ? (
            <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
              Unable to load routes: {routesError}
            </div>
          ) : (
            <RouteSidebar
              routes={sidebarRoutes}
              title="Available Routes"
              description="Select a route to see its stops, service and buses."
              showSearch={false}
              searchQuery={searchQuery}
              onSelect={(index) => {
                const route = sidebarRoutes[index];
                if (route) setSelectedRouteId(route.id);
              }}
            />
          )}
        </div>

        <div className="flex min-h-[28rem] w-full min-w-0 flex-col gap-3 lg:flex-1">
          {activeRoute && (
            <RouteDetails
              route={activeRoute}
              tracking={tracking}
              namedStops={
                namedStops.length > 0
                  ? namedStops
                  : getRouteWaypoints(activeRoute)
              }
            />
          )}
          {!loadingRoutes && !routesError && routes.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No routes are currently available.
            </div>
          )}
          <div
            id="routes-map"
            className="h-[22rem] min-h-[22rem] w-full overflow-hidden rounded-2xl border border-border sm:h-[30rem]"
          >
            <MapView
              center={activeRoute?.pathCoordinates?.[0]}
              routeCoordinates={activeRoute?.pathCoordinates || []}
              routeLabel={
                activeRoute
                  ? formatRouteName(activeRoute.from, activeRoute.to)
                  : undefined
              }
              namedStops={namedStops}
              showBus={!!selectedBus}
              focusOnBus={false}
              busPosition={
                selectedBus
                  ? [selectedBus.latitude, selectedBus.longitude]
                  : undefined
              }
              busName={selectedBus?.bus?.busNumber}
              direction={selectedBus?.direction}
              speed={selectedBus?.speed}
              eta={selectedBus?.eta}
              nextStop={selectedBus?.nextStop}
              status={selectedBus?.status || "Location available"}
              locationFresh={!!selectedBus}
              otherBuses={activeRouteBuses.slice(1)}
            />
          </div>
        </div>
      </div>

      <Stats />
    </TrackLayout>
  );
}
