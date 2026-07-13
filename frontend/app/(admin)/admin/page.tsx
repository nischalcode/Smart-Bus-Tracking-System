"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bus,
  CheckCircle,
  MapPin,
  Users,
  AlertTriangle,
  Route,
  Calendar,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity,
  Zap,
  Shield,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi, StatsData } from "@/utils/api";
import StatsCard from "@/component/ui/StatsCard";
import LoadingSpinner from "@/component/ui/LoadingSpinner";

const quickActions = [
  {
    label: "Manage Buses",
    href: "/admin/buses",
    icon: Bus,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
  },
  {
    label: "Manage Routes",
    href: "/admin/routes",
    icon: Route,
    color: "bg-emerald-500",
    hoverColor: "hover:bg-emerald-600",
  },
  {
    label: "Schedules",
    href: "/admin/schedules",
    icon: Calendar,
    color: "bg-amber-500",
    hoverColor: "hover:bg-amber-600",
  },
  {
    label: "Tracking",
    href: "/admin/tracking",
    icon: MapPin,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    color: "bg-rose-500",
    hoverColor: "hover:bg-rose-600",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    color: "bg-cyan-500",
    hoverColor: "hover:bg-cyan-600",
  },
];

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<StatsData["stats"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<StatsData>("/dashboard/stats", {}, token ?? undefined)
      .then((res) => setStats(res.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!stats) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-gray-300" />
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load dashboard stats.
        </p>
      </div>
    );
  }

  const activeBusPercent =
    stats.totalBuses > 0
      ? Math.round((stats.activeBuses / stats.totalBuses) * 100)
      : 0;
  const onTimePercent =
    stats.totalBuses > 0
      ? Math.round(
          ((stats.totalBuses - stats.delaysCount) / stats.totalBuses) * 100
        )
      : 100;

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good Morning"
      : now.getHours() < 17
      ? "Good Afternoon"
      : "Good Evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#22a34a] via-[#1e8c3f] to-[#1a7a36] p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80">{dateStr}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {greeting}, {user?.name || "Admin"} 👋
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Here&apos;s what&apos;s happening with your bus fleet today.
            {stats.alertNotifications > 0 && (
              <span className="ml-1 font-semibold text-white">
                You have {stats.alertNotifications} alert
                {stats.alertNotifications > 1 ? "s" : ""} that need attention.
              </span>
            )}
          </p>
          <Link
            href="/admin/tracking"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <MapPin className="h-4 w-4" />
            View Live Tracking
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute right-20 top-8 h-20 w-20 rounded-full bg-white/5" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={Bus}
          label="Total Buses"
          value={stats.totalBuses}
          gradient="from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          subtitle={`${stats.activeBuses} active`}
        />
        <StatsCard
          icon={Route}
          label="Total Routes"
          value={stats.totalRoutes}
          gradient="from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          subtitle={`${stats.totalSchedules} schedules`}
        />
        <StatsCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          gradient="from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30"
          iconBg="bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
          subtitle={`${stats.activeTracking} tracked`}
        />
        <StatsCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={stats.alertNotifications}
          gradient="from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          subtitle={`${stats.delaysCount} delays`}
        />
      </div>

      {/* Middle Row: System Overview + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Overview */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              System Overview
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Activity className="h-3.5 w-3.5" />
              Live
            </span>
          </div>

          <div className="space-y-5">
            {/* Active Buses Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Active Buses
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.activeBuses} / {stats.totalBuses}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000"
                  style={{ width: `${activeBusPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {activeBusPercent}% fleet utilization
              </p>
            </div>

            {/* On-Time Performance */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  On-Time Performance
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {onTimePercent}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: `${onTimePercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {stats.delaysCount} delayed out of {stats.totalBuses} buses
              </p>
            </div>

            {/* Live Tracking */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Live Tracking
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.activeTracking} / {stats.totalBuses}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000"
                  style={{
                    width: `${
                      stats.totalBuses > 0
                        ? Math.round(
                            (stats.activeTracking / stats.totalBuses) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {stats.activeTracking} buses currently tracked
              </p>
            </div>

            {/* Schedule Coverage */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Schedule Coverage
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {stats.totalSchedules} / {stats.totalRoutes}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                  style={{
                    width: `${
                      stats.totalRoutes > 0
                        ? Math.round(
                            (stats.totalSchedules / stats.totalRoutes) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {stats.totalSchedules} schedules for {stats.totalRoutes} routes
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl border border-gray-100 p-3 transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white transition-transform group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {action.label}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 dark:text-gray-600" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Fleet Status + Alert Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fleet Status Cards */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Fleet Status
            </h2>
            <Link
              href="/admin/buses"
              className="text-xs font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Active
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-900 dark:text-blue-300">
                {stats.activeBuses}
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                  Delayed
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-300">
                {stats.delaysCount}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                  On Route
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-900 dark:text-emerald-300">
                {stats.activeTracking}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-300">
                  Inactive
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-300">
                {stats.totalBuses - stats.activeBuses}
              </p>
            </div>
          </div>
        </div>

        {/* Alert & Notification Summary */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Alert Summary
            </h2>
            <Link
              href="/admin/notifications"
              className="text-xs font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {/* Alert count */}
            <div className="flex items-center gap-4 rounded-xl border border-red-100 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-300">
                  Active Alerts
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-300">
                  {stats.alertNotifications}
                </p>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                <Shield className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.totalUsers}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Users
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                <Calendar className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.totalSchedules}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Schedules
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
                <TrendingUp className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {onTimePercent}%
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  On Time
                </p>
              </div>
            </div>

            {/* System health */}
            <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    System Health
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  Operational
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">API</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    Healthy
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Database</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    Connected
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tracking</p>
                  <p className="text-xs font-semibold text-emerald-600">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
