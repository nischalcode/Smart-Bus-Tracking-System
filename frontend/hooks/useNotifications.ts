"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { NotificationData } from "@/utils/api";
import { fetchApi } from "@/utils/api";

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:9006/api").replace(/\/api$/, "");

interface UseNotificationsOptions {
  /** The role used to filter notifications and authenticate to the socket. */
  role?: "public_user" | "driver" | "admin" | "super_admin";
}

interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

/**
 * Reusable hook that:
 * 1. Fetches existing notifications from the REST API (filtered by role).
 * 2. Connects to Socket.IO and authenticates with the user's role.
 * 3. Pushes incoming real-time notifications into local state.
 * 4. On reconnect, receives any unread notifications missed while offline.
 * 5. Exposes markAsRead / markAllAsRead helpers that stay in sync with state.
 */
export function useNotifications({
  role = "public_user",
}: UseNotificationsOptions = {}): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // ── Initial REST fetch ────────────────────────────────────────────────────
  useEffect(() => {
    const endpoint =
      ["admin", "super_admin"].includes(role)
        ? "/notifications"
        : `/notifications?recipient=${role}`;

    fetchApi<{ success: boolean; notifications: NotificationData[] }>(endpoint)
      .then((data) => {
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch((err) => console.error("[useNotifications] fetch error:", err))
      .finally(() => setLoading(false));
  }, [role]);

  // ── Socket.IO connection ──────────────────────────────────────────────────
  useEffect(() => {
    const token = typeof window === "undefined" ? null : localStorage.getItem("token");
    const socket: Socket = io(SOCKET_URL, { reconnection: true });
    socketRef.current = socket;

    // Authenticate with role so the server can send role-targeted events
    socket.on("connect", () => {
      socket.emit("auth", { token });
    });

    // Live: a new notification was emitted by the server
    socket.on("notification:new", (notification: NotificationData) => {
      // Secondary client-side guard — filter by recipientRoles if present
      if (
        notification.recipientRoles &&
        notification.recipientRoles.length > 0 &&
        !notification.recipientRoles.includes(role)
      ) {
        return;
      }
      setNotifications((prev) => [
        notification,
        ...prev.filter((n) => n._id !== notification._id),
      ]);
      // Notify the header bell (and any other listeners) that the count changed
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    });

    // Reconnect delivery: server sends notifications missed while offline
    socket.on("notifications:unread", (unread: NotificationData[]) => {
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n._id));
        const novel = unread.filter((n) => !existingIds.has(n._id));
        return novel.length > 0 ? [...novel, ...prev] : prev;
      });
      if (unread.length > 0) {
        window.dispatchEvent(new CustomEvent("notifications:updated"));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [role]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetchApi<{ success: boolean }>(`/notifications/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("[useNotifications] markAsRead error:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetchApi<{ success: boolean; message?: string }>(
        "/notifications/mark-all-read",
        { method: "POST" }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("[useNotifications] markAllAsRead error:", err);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}

export default useNotifications;
