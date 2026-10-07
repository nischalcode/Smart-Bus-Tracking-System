"use client";

import type { RouteData, TrackingData, NamedStop } from "@/utils/api";
import { MapPin, Navigation, Clock, Activity, ListOrdered } from "lucide-react";
import StatusBadge from "@/component/ui/StatusBadge";
import { formatRouteName } from "@/utils/routeFormatter";
import { routeDistanceKm } from "@/utils/haversine";
import { isTrackingFresh } from "@/utils/api";

interface RouteDetailsProps {
  route: RouteData;
  tracking: TrackingData[];
  namedStops: NamedStop[];
}

export default function RouteDetails({ route, tracking, namedStops }: RouteDetailsProps) {
  const activeBusesCount = tracking.filter(t => {
    const rId = typeof t.route === "string" ? t.route : t.route?._id;
    return rId === route._id && isTrackingFresh(t);
  }).length;
  
  const distance = routeDistanceKm(route.pathCoordinates);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white ${route.color || "bg-primary"}`}>
            {route.routeNo}
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {formatRouteName(route.from, route.to)}
            </h3>
            {route.via && (
              <p className="text-xs text-muted-foreground">via {route.via}</p>
            )}
          </div>
        </div>
        <StatusBadge label={route.status || "Status unavailable"} tone={route.active ? "success" : "warning"} pulse={route.active} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 text-center">
          <ListOrdered className="mb-1 h-5 w-5 text-primary" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Stops</span>
          <span className="text-sm font-semibold">{route.stops?.length || 0}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 text-center">
          <Navigation className="mb-1 h-5 w-5 text-primary" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Length</span>
          <span className="text-sm font-semibold">{distance > 0 ? `${distance.toFixed(1)} km` : "Unavailable"}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 text-center">
          <Clock className="mb-1 h-5 w-5 text-primary" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Frequency</span>
          <span className="text-sm font-semibold">{route.frequency || "Unavailable"}</span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg bg-muted p-3 text-center">
          <Activity className="mb-1 h-5 w-5 text-primary" />
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Buses</span>
          <span className="text-sm font-semibold">{activeBusesCount}</span>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> All Stops
        </h4>
        <div className="flex flex-wrap gap-2">
          {namedStops.length > 0 ? (
            namedStops.map((stop, i) => (
              <span key={`${stop.name}-${i}`} className="rounded-full bg-muted/50 border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                {stop.name}
              </span>
            ))
          ) : route.stops?.length ? (
            route.stops.map((stop, i) => (
              <span key={stop._id || `${stop.name}-${i}`} className="rounded-full bg-muted/50 border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                {stop.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No stops data available.</span>
          )}
        </div>
      </div>
      
      <div className="mt-4 border-t border-border pt-4">
        <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" /> Direction Options
        </h4>
        <div className="flex gap-2">
           <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Going</span>
           <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Coming</span>
        </div>
      </div>
    </div>
  );
}
