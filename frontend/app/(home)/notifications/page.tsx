"use client";

import type { LucideIcon } from "lucide-react";
import {
  BusFront,
  CircleX,
  Construction,
  Gift,
  Megaphone,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import NotificationHeader from "@/component/head/NotificationHeader";
import NotificationAlerts from "@/component/notification/NotificationAlerts";
import NotificationBanner from "@/component/notification/NotificationBanner";
import NotificationItems from "@/component/notification/NotificationItems";
import TrackLayout from "@/component/track-layout/TrackLayout";
import { useLanguage } from "@/context/LanguageContext";
import type { NotificationData, NotificationsResponse } from "@/utils/api";
import { fetchApi } from "@/utils/api";
import ExpandableList from "@/component/ui/ExpandableList";
import { useAuth } from "@/context/AuthContext";

const ICON_MAP: Record<string, LucideIcon> = {
  TriangleAlert,
  CircleX,
  BusFront,
  Megaphone,
  Gift,
  Construction,
};

const Page = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    fetchApi<NotificationsResponse>(
      "/notifications?recipient=public_user&limit=100",
    )
      .then((data) => {
        if (data.success && data.notifications)
          setNotifications(data.notifications);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        setError(
          err instanceof Error ? err.message : "Unable to load service alerts.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9006/api";
    const socket = io(apiUrl.replace(/\/api$/, ""));
    socket.on("notification:new", (notification: NotificationData & { recipientRoles?: string[] }) => {
      if (notification.recipientRoles?.length && !notification.recipientRoles.includes("public_user")) return;
      setNotifications((previous) => [notification, ...previous.filter((item) => item._id !== notification._id)]);
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  async function markAllAsRead() {
    setActionError(null);
    try {
      await fetchApi<{ success: boolean; message?: string }>(
        "/notifications/mark-all-read",
        { method: "POST" },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("Failed to mark all read:", err);
      setActionError(
        err instanceof Error ? err.message : "Unable to update notifications.",
      );
    }
  }

  async function markAsRead(id: string) {
    setActionError(null);
    try {
      await fetchApi<{ success: boolean }>(`/notifications/${id}/read`, {
        method: "PATCH",
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      window.dispatchEvent(new CustomEvent("notifications:updated"));
    } catch (err) {
      console.error("Failed to mark read:", err);
      setActionError(
        err instanceof Error ? err.message : "Unable to update notification.",
      );
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <TrackLayout>
      <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-5 lg:flex-row lg:gap-6">
        <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-[2]">
          <div>
            <NotificationHeader
              notifications={notifications}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              onMarkAllRead={markAllAsRead}
              allowMarkRead={isAuthenticated}
            />
          </div>

          <div>
            {actionError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
              >
                {actionError}
              </div>
            )}
            {loading ? (
              <div className="p-6 text-center text-gray-500">
                {t("notifications.loading")}
              </div>
            ) : error ? (
              <div
                role="alert"
                className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-center text-sm text-danger"
              >
                Unable to load service alerts: {error}
              </div>
            ) : (
              (() => {
                const filtered = notifications.filter((n) => {
                  if (activeCategory === "All") return true;
                  if (activeCategory === "Alerts")
                    return (n.badge || "").toLowerCase() === "alert";
                  if (activeCategory === "Service Updates")
                    return (n.badge || "").toLowerCase() === "service update";
                  if (activeCategory === "Promotions")
                    return (n.badge || "").toLowerCase() === "promotion";
                  if (activeCategory === "General")
                    return (n.badge || "").toLowerCase() === "general";
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-6 text-center text-gray-500">
                      {t("notifications.empty")}
                    </div>
                  );
                }

                return (
                  <ExpandableList
                    items={filtered}
                    initialCount={5}
                    showMoreLabel={t("notifications.load_more") ?? "Load More"}
                    showLessLabel="Show Less"
                    containerClassName="space-y-3"
                    renderItem={(n) => {
                      const Icon = ICON_MAP[n.icon] || TriangleAlert;

                      return (
                        <NotificationItems
                          key={n._id}
                          icon={Icon}
                          title={n.title}
                          description={n.description}
                          badge={n.badge}
                          time={new Date(n.createdAt).toLocaleString()}
                          iconBg={n.iconBg}
                          iconColor={n.iconColor}
                          badgeBg={n.badgeBg}
                          badgeColor={n.badgeColor}
                          read={!!n.read}
                          onMarkRead={
                            isAuthenticated
                              ? () => markAsRead(n._id)
                              : undefined
                          }
                        />
                      );
                    }}
                  />
                );
              })()
            )}
          </div>
        </div>

        <div className="flex min-w-0 w-full flex-col gap-3 lg:flex-1">
          <div>
            <NotificationAlerts
              notifications={notifications}
              loading={loading}
              error={error}
              onViewAllAlerts={() => {
                setActiveCategory("Alerts");
                scrollToTop();
              }}
            />
          </div>
          <div>
            <NotificationBanner />
          </div>
        </div>
      </div>
    </TrackLayout>
  );
};

export default Page;
