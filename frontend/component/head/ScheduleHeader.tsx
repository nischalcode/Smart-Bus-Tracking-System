"use client";

import { useEffect, useState } from "react";
import { IoCalendarOutline, IoChevronDown } from "react-icons/io5";
import { useLanguage } from "@/context/LanguageContext";
import type { RouteData, RoutesResponse } from "@/utils/api";
import { fetchApi } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

interface ScheduleHeaderProps {
  selectedRouteId?: string | null;
  onRouteChange?: (routeId: string | null) => void;
  selectedDirection?: string;
  onDirectionChange?: (direction: string) => void;
}

const ScheduleHeader = ({
  selectedRouteId = null,
  onRouteChange,
  selectedDirection = "",
  onDirectionChange,
}: ScheduleHeaderProps) => {
  const { t, language } = useLanguage();
  const [routes, setRoutes] = useState<RouteData[]>([]);

  useEffect(() => {
    fetchApi<RoutesResponse>("/routes")
      .then((data) => {
        if (data.success && data.routes) setRoutes(data.routes);
      })
      .catch(() => {});
  }, []);

  function handleRouteChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onRouteChange?.(event.target.value || null);
  }

  const formattedDate = new Date().toLocaleDateString(
    language === "ne" ? "ne-NP" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors md:flex-row">
      <div className="flex-1">
        <label
          htmlFor="schedule-date"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("schedule_header.select_date")}
        </label>

        <div className="relative">
          <input
            id="schedule-date"
            type="text"
            value={formattedDate}
            readOnly
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1">
        <label
          htmlFor="schedule-route"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("schedule_header.select_route")}
        </label>

        <div className="relative">
          <select
            id="schedule-route"
            value={selectedRouteId || ""}
            onChange={handleRouteChange}
            className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{t("schedule_header.all_routes")}</option>
            {routes.map((route) => (
              <option key={route._id} value={route._id}>
                {route.routeNo} — {formatRouteName(route.from, route.to)}
              </option>
            ))}
          </select>
          <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1">
        <label
          htmlFor="schedule-direction"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          {t("schedule_header.select_direction")}
        </label>

        <div className="relative">
          <select
            id="schedule-direction"
            value={selectedDirection}
            onChange={(e) => onDirectionChange?.(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-4 pr-10 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">{t("schedule_header.all_directions")}</option>
            <option value="Going">Going</option>
            <option value="Coming">Coming</option>
          </select>
          <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default ScheduleHeader;
