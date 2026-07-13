"use client";

import {
    IoCalendarOutline,
    IoChevronDown,
  } from "react-icons/io5";
const ScheduleHeader = () => {
  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Date
        </label>

        <div className="relative">
          <input
            type="text"
            value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            readOnly
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
          />

          <IoCalendarOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
        </div>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Route
        </label>

        <div className="relative">
          <select className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-green-500 focus:outline-none">
            <option>All Routes</option>
            <option>Route A</option>
            <option>Route B</option>
            <option>Route C</option>
          </select>

          <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" />
        </div>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Direction
        </label>

        <div className="relative">
          <select className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 focus:border-green-500 focus:outline-none">
            <option>All Directions</option>
            <option>Outbound</option>
            <option>Inbound</option>
          </select>

          <IoChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500" />
        </div>
      </div>
    </div>
  )
}

export default ScheduleHeader