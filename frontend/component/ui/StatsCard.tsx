"use client";

import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  gradient?: string;
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
}

export default function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  gradient = "from-white to-gray-50",
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  subtitle,
}: StatsCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-gray-700 ${gradient}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  trendUp === false ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {trendUp === false ? "\u2193" : "\u2191"} {trend}
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110 ${iconColor}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Decorative corner element */}
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gray-900/[0.03] dark:bg-white/[0.03]" />
    </div>
  );
}
