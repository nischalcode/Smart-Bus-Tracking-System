"use client";

import { MapPin, Navigation, Clock, Gauge, Bus, User, Activity } from "lucide-react";
import type { TrackingData } from "@/utils/api";
import StatusBadge from "@/component/ui/StatusBadge";
import { formatRouteName } from "@/utils/routeFormatter";
import { isTrackingFresh } from "@/utils/api";

interface BusDetailsProps {
  tracking: TrackingData;
}

export default function BusDetails({ tracking }: BusDetailsProps) {
  const isFresh = isTrackingFresh(tracking);
  const isDelayed = tracking.status?.toLowerCase().includes("delay");

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-colors mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{tracking.bus?.busNumber || "Bus"}</h3>
            <p className="text-xs text-muted-foreground">
              {tracking.route?.routeNo} • {formatRouteName(tracking.route?.from, tracking.route?.to)}
            </p>
          </div>
        </div>
        <StatusBadge
          label={isFresh ? tracking.status || "Live" : "Location unavailable"}
          tone={!isFresh ? "neutral" : isDelayed ? "warning" : "success"}
          pulse={isFresh}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Driver</span>
            <span className="text-sm font-medium">{tracking.driverName || "Driver unavailable"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Direction</span>
            <span className="text-sm font-medium">{tracking.direction || "Direction unavailable"}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Current Stop</span>
          </div>
          <span className="text-sm font-semibold">
            {isFresh ? tracking.currentStop || "Unavailable" : "Unavailable"}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Next Stop</span>
          </div>
          <span className="text-sm font-semibold">
            {isFresh ? tracking.nextStop || "Unavailable" : "Unavailable"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Speed</span>
          </div>
          <span className="text-sm font-semibold">
            {isFresh && typeof tracking.speed === "number"
              ? `${tracking.speed.toFixed(0)} km/h`
              : "Unavailable"}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">ETA</span>
          </div>
          <span className="text-sm font-semibold">{isFresh ? tracking.eta || "Unavailable" : "Unavailable"}</span>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Remaining</span>
          </div>
          <span className="text-sm font-semibold">
            {isFresh && typeof tracking.remainingDistance === "number"
              ? `${tracking.remainingDistance.toFixed(1)} km`
              : "Unavailable"}
          </span>
        </div>
      </div>
    </div>
  );
}
