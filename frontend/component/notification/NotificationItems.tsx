"use client";

import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface NotificationItemsProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge: string;
  time: string;
  iconBg?: string;
  iconColor?: string;
  badgeBg?: string;
  badgeColor?: string;
  read?: boolean;
  onMarkRead?: () => void;
}

const NotificationItems = ({
  icon: Icon,
  title,
  description,
  badge,
  time,
  iconBg = "bg-red-100",
  iconColor = "text-red-500",
  badgeBg = "bg-red-100",
  badgeColor = "text-red-600",
  read = false,
  onMarkRead,
}: NotificationItemsProps) => {
  const { t } = useLanguage();
  return (
    <section
      className={`w-full rounded-xl border border-border bg-card p-4 transition-colors ${read ? "opacity-60" : ""}`}
    >
      <div className="flex min-w-0 gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconBg}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="break-words text-sm font-semibold text-foreground">{title}</h3>

            <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
          </div>

          <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{description}</p>

          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${badgeBg} ${badgeColor}`}
            >
              {badge}
            </span>

            {!read && onMarkRead && (
              <button
                type="button"
                onClick={onMarkRead}
                className="ml-2 rounded-md bg-muted px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted/80"
              >
                {t("notifications.mark_as_read")}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationItems;
