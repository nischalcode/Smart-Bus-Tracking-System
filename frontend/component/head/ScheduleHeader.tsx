"use client";

import { CheckCheck, ChevronDown } from "lucide-react";
import { useState } from "react";

const categories = [
    {
      name: "All",
      count: 24,
      badge: "bg-primary text-white",
    },
    {
      name: "Alerts",
      count: 6,
      badge: "bg-red-100 text-red-600",
    },
    {
      name: "Service Updates",
      count: 8,
      badge: "bg-blue-100 text-blue-600",
    },
    {
      name: "Promotions",
      count: 2,
      badge: "bg-purple-100 text-purple-600",
    },
    {
      name: "General",
      count: 8,
      badge: "bg-gray-200 text-gray-700",
    },
  ];

const ScheduleHeader = () => {
    const [activeCategory, setActiveCategory] = useState("All")
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-2 shadow-sm lg:flex-row lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
          onClick={() => setActiveCategory(item.name)}
            key={item.name}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition
                ${
                  activeCategory === item.name
                    ? "bg-green-100 text-primary"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
          >
            {item.name}

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.badge}`}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
        <CheckCheck className="h-4 w-4" />

        <span>Mark all as read</span>

        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ScheduleHeader;