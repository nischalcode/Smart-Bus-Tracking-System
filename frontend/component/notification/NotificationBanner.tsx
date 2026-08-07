"use client";

import { Bell } from "lucide-react";

const NotificationBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-6 transition-colors">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-bl-full bg-primary/10"></div>

      <div className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-card p-3 shadow-md border border-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
          <Bell className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="relative z-10 pr-20">
        <h3 className="mb-2 text-lg font-bold text-foreground">
          Stay Informed, Stay Ahead
        </h3>

        <p className="mb-8 text-sm leading-6 text-muted-foreground">
          Allow notifications to get real-time updates about your buses and
          important alerts.
        </p>

        <div className="flex gap-3">
          <button className="flex-1 rounded-lg border border-border bg-card py-2 text-sm font-medium text-foreground transition hover:bg-muted">
            Not Now
          </button>

          <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;