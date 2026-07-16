"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  fetchApi,
  type RouteData,
  type RoutesResponse,
  type TrackingData,
  type TrackingResponse,
} from "@/utils/api";

const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ??
    "http://localhost:9005");

export function useLiveTracking() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [tracking, setTracking] = useState<TrackingData[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(true);

  // Load routes once
  useEffect(() => {
    fetchApi<RoutesResponse>("/routes")
      .then((data) => {
        if (data.success && data.routes) setRoutes(data.routes);
      })
      .catch((err) => console.error("Failed to load routes:", err))
      .finally(() => setLoadingRoutes(false));
  }, []);

  // Load initial tracking and open socket
  useEffect(() => {
    let mounted = true;
    let socket: Socket | null = null;

    const updateTrackingEntry = (incoming: TrackingData) => {
      setTracking((prev) => {
        const existingIndex = prev.findIndex((t) => t._id === incoming._id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = incoming;
          return next;
        }
        return [...prev, incoming];
      });
    };

    fetchApi<TrackingResponse>("/tracking")
      .then((data) => {
        if (!mounted) return;
        if (data.success && data.tracking) setTracking(data.tracking);
      })
      .catch((err) => console.error("Failed to load tracking:", err))
      .finally(() => {
        if (mounted) setLoadingTracking(false);
      });

    socket = io(SOCKET_BASE, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      console.log("Live tracking socket connected");
    });

    socket.on("bus:location:updated", (data: unknown) => {
      if (!mounted || !data || typeof data !== "object") return;
      updateTrackingEntry(data as TrackingData);
    });

    socket.on("connect_error", (err) => {
      console.error("Live tracking socket error:", err.message);
    });

    return () => {
      mounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const trackingByRouteId = useMemo(() => {
    const map = new Map<string, TrackingData>();
    for (const t of tracking) {
      if (t.route?._id) map.set(t.route._id, t);
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
