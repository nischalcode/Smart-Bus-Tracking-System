"use client";

import { Bell, Menu, X } from "lucide-react";
import { headerConfig } from "./headerConfig";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchApi, NotificationsResponse } from "@/utils/api";
import PublicActions from "@/component/head/HeaderActions/PublicActions";

type Props = {
  onMenuToggle?: () => void;
};

const TrackHeader = ({ onMenuToggle }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  // const { user } = useAuth();
  const page =
    headerConfig[pathname as keyof typeof headerConfig] ?? {
      title: "Dashboard",
      description: "Welcome to Smart Bus Tracking",
    };

  const [notificationCount, setNotificationCount] = useState<number>(0);

  useEffect(() => {
    let mounted = true;

    fetchApi<NotificationsResponse>("/notifications")
      .then((data) => {
        if (!mounted) return;
        if (data.success && data.notifications)
          setNotificationCount(data.notifications.filter((n) => !n.read).length);
      })
      .catch(() => {});

    const handler = () => {
      fetchApi<NotificationsResponse>("/notifications")
        .then((data) => {
          if (!mounted) return;
          if (data.success && data.notifications)
            setNotificationCount(
              data.notifications.filter((n) => !n.read).length
            );
        })
        .catch(() => {});
    };

    window.addEventListener("notifications:updated", handler);

    return () => {
      mounted = false;
      window.removeEventListener("notifications:updated", handler);
    };
  }, []);

  return (
    <header className="flex h-20 items-center justify-between border-b border-border bg-card px-4 text-card-foreground sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {page.title}
          </h2>
          <p className="text-sm text-muted-foreground">{page.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">

        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => router.push("/notifications")}
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6 text-muted-foreground hover:text-foreground" />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          <PublicActions />
        </div>      
      </div>
    </header>
  );
};

export default TrackHeader;
