"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  Bus,
  CalendarDays,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useLiveTracking } from "@/hooks/useLiveTracking";
import {
  fetchApi,
  isTrackingFresh,
  type NotificationData,
  type NotificationsResponse,
  type ScheduleData,
  type SchedulesResponse,
} from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

function OverviewCard({
  title,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  href: string;
  icon: typeof Bus;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-foreground">
          <Icon className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate">{title}</span>
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {t("home_overview.view_all")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function PublicOverview() {
  const { t } = useLanguage();
  const {
    routes,
    tracking,
    loadingRoutes,
    loadingTracking,
    routesError,
    trackingError,
  } = useLiveTracking();
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);

  useEffect(() => {
    fetchApi<SchedulesResponse>("/schedules?limit=100")
      .then((data) => setSchedules(data.schedules || []))
      .catch((error) => {
        console.error("Failed to load home schedules:", error);
        setSchedulesError(true);
      })
      .finally(() => setSchedulesLoading(false));

    fetchApi<NotificationsResponse>(
      "/notifications?recipient=public_user&limit=100",
    )
      .then((data) => setNotifications(data.notifications || []))
      .catch((error) => {
        console.error("Failed to load home service alerts:", error);
        setNotificationsError(true);
      })
      .finally(() => setNotificationsLoading(false));
  }, []);

  const freshBuses = useMemo(
    () => tracking.filter((item) => isTrackingFresh(item)),
    [tracking],
  );
  const popularRoutes = useMemo(
    () =>
      routes
        .map((route) => ({
          route,
          activeBuses: freshBuses.filter((bus) => {
            const routeId =
              typeof bus.route === "string" ? bus.route : bus.route?._id;
            return routeId === route._id;
          }).length,
        }))
        .sort(
          (a, b) =>
            b.activeBuses - a.activeBuses ||
            a.route.routeNo.localeCompare(b.route.routeNo, undefined, {
              numeric: true,
            }),
        )
        .slice(0, 3),
    [freshBuses, routes],
  );
  const latestAlerts = notifications
    .filter((item) =>
      ["alert", "service update", "general", "announcement"].includes(
        item.badge.toLowerCase(),
      ),
    )
    .slice(0, 3);
  const upcomingSchedules = [...schedules]
    .filter((item) => item.active)
    .sort((a, b) => a.firstBus.localeCompare(b.firstBus))
    .slice(0, 3);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <OverviewCard
          title={t("home_overview.popular_routes")}
          href="/routes"
          icon={MapPin}
        >
          {loadingRoutes ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.loading")}</p>
          ) : routesError ? (
            <p role="alert" className="text-sm text-danger">{t("home_overview.unavailable")}</p>
          ) : popularRoutes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.no_routes")}</p>
          ) : (
            <ul className="space-y-3">
              {popularRoutes.map(({ route, activeBuses }) => (
                <li key={route._id} className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Route {route.routeNo} · {formatRouteName(route.from, route.to)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("home_overview.frequency")}: {route.frequency || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {activeBuses} {t("home_overview.active")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OverviewCard>

        <OverviewCard
          title={t("home_overview.active_buses")}
          href="/track-bus"
          icon={Bus}
        >
          {loadingTracking ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.loading")}</p>
          ) : trackingError ? (
            <p role="alert" className="text-sm text-danger">{t("home_overview.unavailable")}</p>
          ) : freshBuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.no_active_buses")}</p>
          ) : (
            <ul className="space-y-3">
              {freshBuses.slice(0, 3).map((bus) => (
                <li key={bus._id} className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {bus.bus?.busNumber || "Bus"} · Route {bus.route?.routeNo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatRouteName(bus.route?.from, bus.route?.to)}
                      {bus.nextStop ? ` · Next: ${bus.nextStop}` : ""}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                    <Activity className="h-3.5 w-3.5" />
                    {bus.status || "Live"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OverviewCard>

        <OverviewCard
          title={t("home_overview.latest_alerts")}
          href="/notifications"
          icon={Bell}
        >
          {notificationsLoading ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.loading")}</p>
          ) : notificationsError ? (
            <p role="alert" className="text-sm text-danger">{t("home_overview.unavailable")}</p>
          ) : latestAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.no_alerts")}</p>
          ) : (
            <ul className="space-y-3">
              {latestAlerts.map((alert) => (
                <li key={alert._id} className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{alert.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{alert.description}</p>
                </li>
              ))}
            </ul>
          )}
        </OverviewCard>

        <OverviewCard
          title={t("home_overview.upcoming_schedules")}
          href="/schedule"
          icon={CalendarDays}
        >
          {schedulesLoading ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.loading")}</p>
          ) : schedulesError ? (
            <p role="alert" className="text-sm text-danger">{t("home_overview.unavailable")}</p>
          ) : upcomingSchedules.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("home_overview.no_schedules")}</p>
          ) : (
            <ul className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <li key={schedule._id} className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      Route {schedule.route?.routeNo} · {formatRouteName(schedule.route?.from, schedule.route?.to)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("home_overview.service_window")}: {schedule.firstBus}–{schedule.lastBus}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {schedule.frequency}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </OverviewCard>
      </div>
    </section>
  );
}
