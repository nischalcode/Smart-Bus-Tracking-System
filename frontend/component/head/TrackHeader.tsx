"use client";

import Image from "next/image";
import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { headerConfig } from "./headerConfig";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchApi, NotificationsResponse } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

type Props = {
  onMenuToggle?: () => void;
};

const TrackHeader = ({ onMenuToggle }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
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
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {page.title}
          </h2>
          <p className="text-sm text-gray-500">{page.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <button
          onClick={() => router.push("/notifications")}
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6 text-gray-600 hover:text-black" />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
              {notificationCount}
            </span>
          )}
        </button>

        <div className="flex cursor-pointer items-center gap-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-gray-200">
            <Image
              src="/user.jpg"
              alt="User"
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          </div>

          <div className="hidden text-sm sm:block">
            <p>
              <span className="text-gray-500">Hi, </span>
              <span className="font-semibold text-gray-900">
                {user?.name || "User"}
              </span>
            </p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
        </div>
      </div>
    </header>
  );
};

export default TrackHeader;
