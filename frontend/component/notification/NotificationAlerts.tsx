"use client";

import { TriangleAlert, Construction } from "lucide-react";
import type { NotificationData } from "@/utils/api";

type Props = {
  notifications?: NotificationData[];
  onViewAllAlerts?: () => void;
  loading?: boolean;
  error?: string | null;
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "just now";
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const NotificationAlerts = ({
  notifications = [],
  onViewAllAlerts,
  loading = false,
  error,
}: Props) => {
  const alerts = notifications
    .filter((n) => (n.badge || "").toLowerCase() === "alert")
    .slice(0, 3)
    .map((n) => ({
      ...n,
      time: timeAgo(n.createdAt),
      icon: n.icon === "Construction" ? Construction : TriangleAlert,
      iconBg: n.iconBg || "bg-red-100",
      iconColor: n.iconColor || "text-red-600",
    }));

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground sm:text-lg">Active Alerts</h3>

        <button
          type="button"
          onClick={onViewAllAlerts}
          className="text-xs font-medium text-primary hover:underline sm:text-sm"
        >
          View All
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-danger">
          Alerts are unavailable: {error}
        </p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active alerts.</p>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div key={alert._id} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${alert.iconBg} ${alert.iconColor}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="break-words text-sm font-semibold text-foreground">
                    {alert.title}
                  </h4>

                  <div className="mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{alert.description}</span>
                    <span>{alert.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onViewAllAlerts}
        className="mt-4 w-full rounded-lg border border-danger/30 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 active:scale-[0.98]"
      >
        View All Alerts
      </button>
    </div>
  );
};

export default NotificationAlerts;