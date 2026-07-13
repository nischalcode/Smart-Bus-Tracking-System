"use client";

import { useEffect, useState } from "react";
import { IoArrowForward, IoChevronDown, IoEyeOutline } from "react-icons/io5";
import { fetchApi, SchedulesResponse, ScheduleData } from "@/utils/api";

type Props = {
  onSelectSchedule?: (schedule: ScheduleData) => void;
  selectedId?: string | null;
};

const BusScheduleTable = ({ onSelectSchedule, selectedId }: Props) => {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchApi<SchedulesResponse>("/schedules")
      .then((data) => {
        if (data.success && data.schedules) setSchedules(data.schedules);
      })
      .catch((err) => console.error("Failed to load schedules:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900">Bus Schedules</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3 font-medium">Route</th>
              <th className="px-6 py-3 font-medium">Bus Number</th>
              <th className="px-6 py-3 font-medium">First Bus</th>
              <th className="px-6 py-3 font-medium">Last Bus</th>
              <th className="px-6 py-3 font-medium">Frequency</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Loading schedules...
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr
                  key={schedule._id}
                  onClick={() => onSelectSchedule?.(schedule)}
                  className={`cursor-pointer transition hover:bg-gray-50 ${
                    selectedId === schedule._id
                      ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
                      : schedule.active
                      ? "bg-green-50"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded font-bold ${
                          schedule.route?.color || "bg-green-600 text-white"
                        }`}
                      >
                        {schedule.route?.routeNo}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          {schedule.route?.from}

                          <IoArrowForward className="text-xs text-gray-400" />

                          {schedule.route?.to}
                        </div>

                        <p className="text-xs text-gray-500">via {schedule.route?.via}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-600">{schedule.bus?.busNumber}</td>

                  <td className="px-6 py-4 font-medium text-gray-900">{schedule.firstBus}</td>

                  <td className="px-6 py-4 font-medium text-gray-900">{schedule.lastBus}</td>

                  <td className="px-6 py-4 text-gray-600">{schedule.frequency}</td>

                  <td className="px-6 py-4">
                    <span className={`rounded-md px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700`}>
                      {schedule.status || "N/A"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSchedule?.(schedule);
                      }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                        selectedId === schedule._id
                          ? "border-blue-200 bg-blue-100 text-blue-600"
                          : "border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      <IoEyeOutline />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center border-t border-gray-200 p-4">
        <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
          View More Schedules

          <IoChevronDown className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default BusScheduleTable;