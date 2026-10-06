"use client";

import { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import {
  fetchApi,
  RoutesResponse,
  RouteData,
  TrackingResponse,
  TrackingData,
} from "@/utils/api";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:9006/api").replace(/\/api$/, "");
const POLL_INTERVAL_MS = 10000; // Background polling fallback

export function useLiveTracking() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [tracking, setTracking] = useState<TrackingData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(true);

  // ── Load routes ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchApi<RoutesResponse>("/routes")
      .then((data) => {
        if (data.success && data.routes) setRoutes(data.routes);
      })
      .catch((err) => console.error("Failed to load routes:", err))
      .finally(() => setLoadingRoutes(false));
  }, []);

  // ── Real-time Socket.IO updates + polling fallback ─────────────────────────
  useEffect(() => {
    let mounted = true;

    // 1. Initial REST fetch
    const fetchTracking = () => {
      fetchApi<TrackingResponse>("/tracking")
        .then((data) => {
          if (!mounted) return;
          if (data.success && data.tracking) setTracking(data.tracking);
        })
        .catch((err) => console.error("Failed to load tracking:", err))
        .finally(() => {
          if (mounted) setLoadingTracking(false);
        });
    };

    fetchTracking();

    // 2. Connect to Socket.IO for real-time telemetry updates without page refresh
    const socket: Socket = io(SOCKET_URL, {
      reconnection: true,
      transports: ["websocket", "polling"],
    });

    socket.on("tracking-update", (data: TrackingData[]) => {
      if (!mounted || !Array.isArray(data) || data.length === 0) return;

      setTracking((prev) => {
        const next = [...prev];
        for (const item of data) {
          const incomingBusId = typeof item.bus === "string" ? item.bus : item.bus?._id;
          const idx = next.findIndex((t) => {
            const tBusId = typeof t.bus === "string" ? t.bus : t.bus?._id;
            return (incomingBusId && tBusId === incomingBusId) || t._id === item._id;
          });

          if (idx !== -1) {
            next[idx] = { ...next[idx], ...item };
          } else {
            next.push(item);
          }
        }
        return next;
      });
    });

    // 3. Fallback interval to guarantee sync in case of connection drop
    const id = setInterval(fetchTracking, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(id);
      socket.off("tracking-update");
      socket.disconnect();
    };
  }, []);

  const trackingByRouteId = useMemo(() => {
    const map = new Map<string, TrackingData>();

    for (const t of tracking) {
      const routeId = typeof t.route === "string" ? t.route : t.route?._id;
      if (routeId) {
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
