"use client";

import {
  Bell,
  Mail,
  Smartphone,
  Settings,
  ChevronRight,
} from "lucide-react";

const settings = [
  {
    title: "Push Notifications",
    status: "Enabled",
    enabled: true,
    icon: Bell,
  },
  {
    title: "Email Notifications",
    status: "Enabled",
    enabled: true,
    icon: Mail,
  },
  {
    title: "SMS Notifications",
    status: "Disabled",
    enabled: false,
    icon: Smartphone,
  },
];

const NotificationSettings = () => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      
      <h2 className="mb-5 text-xl font-bold text-gray-900">
        Notification Settings
      </h2>

     
      <div className="space-y-5">
        {settings.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              className="flex w-full items-center justify-between rounded-lg p-1 transition hover:bg-gray-50"
            >
              
              <div className="flex items-center gap-4">
                <Icon className="h-6 w-6 text-gray-500" />

                <p className="text-base font-medium text-gray-900">
                  {item.title}
                </p>
              </div>

              
              <div className="flex items-center gap-1">
                <span
                  className={`text-base font-medium ${
                    item.enabled
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  {item.status}
                </span>

                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          );
        })}
      </div>

      
      <div className="my-5 border-t border-gray-200" />

      
      <button className="flex w-full items-center justify-between rounded-lg p-1 transition hover:bg-gray-50">
        <div className="flex items-center gap-4">
          <Settings className="h-6 w-6 text-gray-500" />

          <div className="text-left">
            <h3 className="text-base font-medium text-gray-900">
              Manage Preferences
            </h3>

            <p className="text-sm text-gray-500">
              Choose what you want to receive
            </p>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  );
};

export default NotificationSettings;