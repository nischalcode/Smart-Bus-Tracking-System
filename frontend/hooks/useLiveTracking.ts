"use client";

import { useEffect, useState, useMemo } from "react";
import {
  fetchApi,
  RoutesResponse,
  RouteData,
  TrackingResponse,
  TrackingData,
} from "@/utils/api";
import { io } from "socket.io-client";

const POLL_INTERVAL_MS = 5000;

export function useLiveTracking() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [tracking, setTracking] = useState<TrackingData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(true);

  useEffect(() => {
    fetchApi<RoutesResponse>("/routes")
      .then((data) => {
        if (data.success && data.routes) setRoutes(data.routes);
      })
      .catch((err) => console.error("Failed to load routes:", err))
      .finally(() => setLoadingRoutes(false));
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchTracking = () => {
      fetchApi<TrackingResponse>("/tracking")
        .then((data) => {
          console.log("Tracking api",data);
          
          if (!mounted) return;
          if (data.success && data.tracking) setTracking(data.tracking);
        })
        .catch((err) => console.error("Failed to load tracking:", err))
        .finally(() => {
          if (mounted) setLoadingTracking(false);
        });
    };

    fetchTracking();
    const id = setInterval(fetchTracking, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:9006";
    const socket = io(socketUrl);

    socket.on("bus:location:updated", (data: any) => {
      setTracking(prev => prev.map(t => {
        const bId = typeof t.bus === "string" ? t.bus : t.bus?._id;
        if (bId === data.busId || t.busId === data.busId) {
          return { 
            ...t, 
            latitude: data.lat, 
            longitude: data.lng, 
            speed: data.speed ?? t.speed,
            eta: data.eta !== undefined ? data.eta : t.eta,
            nextStop: data.nextStop !== undefined ? data.nextStop : t.nextStop,
            currentStop: data.currentStop !== undefined ? data.currentStop : t.currentStop,
            isStopped: data.isStopped !== undefined ? data.isStopped : t.isStopped,
            upcomingStops: data.upcomingStops || t.upcomingStops
          };
        }
        return t;
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // const trackingByRouteId = useMemo(() => {
  //   const map = new Map<string, TrackingData>();
  //   for (const t of tracking) {
  //     if (t.route?._id) map.set(t.route._id, t);
  //   }
  //   return map;
  // }, [tracking]);
const trackingByRouteId = useMemo(() => {
  const map = new Map<string, TrackingData>();


  for (const t of tracking) {
  const routeId =
    typeof t.route === "string"
      ? t.route
      : t.route?._id;

  if (!routeId) continue;

  const existing = map.get(routeId);

  const currentTime = t.timestamp
    ? new Date(t.timestamp).getTime()
    : 0;

  const existingTime = existing?.timestamp
    ? new Date(existing.timestamp).getTime()
    : 0;

  if (!existing || currentTime > existingTime) {
    map.set(routeId, t);
  }
}


  return map;
}, [tracking]);
  return {
    routes,
    tracking,
    loadingRoutes,
    loadingTracking,
    trackingByRouteId,
  };
}
