"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchApi, type NotificationsResponse } from "@/utils/api";

const POLL_INTERVAL_MS = 30000;

const NotificationBanner = () => {
  const [enabled, setEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastSeenRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const pref = localStorage.getItem("notifications_enabled");
    const wasDismissed = localStorage.getItem("notifications_dismissed");
    if (pref === "true") {
      setEnabled(true);
      setDismissed(false);
    } else if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled || dismissed) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const checkForNew = async () => {
      try {
        const data = await fetchApi<NotificationsResponse>("/notifications?limit=5");
        if (!data.success || !data.notifications?.length) return;

        const latest = data.notifications[0];
        if (!latest) return;

        if (lastSeenRef.current && latest._id !== lastSeenRef.current) {
          showBrowserNotification(latest.title, latest.description);
        }

        lastSeenRef.current = latest._id;
      } catch {
        // silently fail
      }
    };

    checkForNew();
    intervalRef.current = setInterval(checkForNew, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, dismissed]);

  function showBrowserNotification(title: string, body: string) {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }

  async function handleEnable() {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setEnabled(true);
        setDismissed(false);
        localStorage.setItem("notifications_enabled", "true");
        localStorage.removeItem("notifications_dismissed");

        new Notification("SmartBus Notifications Enabled", {
          body: "You will now receive real-time bus updates and alerts.",
          icon: "/favicon.ico",
        });
      }
    }
  }

  function handleDismiss() {
    setDismissed(true);
    setEnabled(false);
    localStorage.setItem("notifications_dismissed", "true");
    localStorage.removeItem("notifications_enabled");
  }

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-green-100 p-6">

      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-bl-full bg-white/40"></div>


      <div className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-3 shadow">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
          <Bell className="h-5 w-5 text-primary" />
        </div>
      </div>


      <div className="relative z-10 pr-20">
        <h3 className="mb-2 text-lg font-bold text-gray-900">
          Stay Informed, Stay Ahead
        </h3>

        <p className="mb-8 text-sm leading-6 text-gray-600">
          Allow notifications to get real-time updates about your buses and
          important alerts.
        </p>


        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Not Now
          </button>

          <button
            type="button"
            onClick={handleEnable}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
