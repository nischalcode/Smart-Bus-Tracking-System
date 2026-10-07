"use client";

import { CheckCheck, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

import type { NotificationData } from "@/utils/api";

type Props = {
  notifications: NotificationData[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onMarkAllRead: () => void;
  allowMarkRead?: boolean;
};

const NotificationHeader = ({
  notifications,
  activeCategory,
  onCategoryChange,
  onMarkAllRead,
  allowMarkRead = true,
}: Props) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const counts = notifications.reduce(
    (acc, n) => {
      const badge = (n.badge || "").toLowerCase();
      acc.all += 1;
      if (badge === "alert") acc.alerts += 1;
      if (badge === "service update") acc.serviceUpdates += 1;
      if (badge === "promotion") acc.promotions += 1;
      if (badge === "general") acc.general += 1;
      return acc;
    },
    { all: 0, alerts: 0, serviceUpdates: 0, promotions: 0, general: 0 },
  );

  const categories = [
    {
      name: "All",
      label: t("notifications.categories.all"),
      count: counts.all,
      badge: "bg-primary text-white",
    },
    {
      name: "Alerts",
      label: t("notifications.categories.alerts"),
      count: counts.alerts,
      badge: "bg-red-100 text-red-600",
    },
    {
      name: "Service Updates",
      label: t("notifications.categories.service_updates"),
      count: counts.serviceUpdates,
      badge: "bg-blue-100 text-blue-600",
    },
    {
      name: "Promotions",
      label: t("notifications.categories.promotions"),
      count: counts.promotions,
      badge: "bg-purple-100 text-purple-600",
    },
    {
      name: "General",
      label: t("notifications.categories.general"),
      count: counts.general,
      badge: "bg-gray-200 text-gray-700",
    },
  ];

  return (
    <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-border bg-card p-2 shadow-sm lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
            type="button"
            onClick={() => onCategoryChange(item.name)}
            key={item.name}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
                ${
                  activeCategory === item.name
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
          >
            {item.label}

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge}`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {allowMarkRead && (
        <button
          type="button"
          onClick={async () => {
            try {
              setLoading(true);
              await onMarkAllRead();
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className={`flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted ${
            loading ? "opacity-60 cursor-wait" : ""
          }`}
        >
          <CheckCheck className="h-4 w-4" />
          <span>
            {loading
              ? t("notifications.marking")
              : t("notifications.mark_all_read")}
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default NotificationHeader;
