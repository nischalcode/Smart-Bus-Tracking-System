import { IoChevronForward } from "react-icons/io5";
import type { ScheduleData } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

interface NextDeparturesProps {
  schedules: ScheduleData[];
}

import ExpandableList from "@/component/ui/ExpandableList";

const NextDepartures = ({ schedules }: NextDeparturesProps) => {
  return (
    <div className="border-b border-gray-100 p-5 bg-white rounded-xl shadow-sm">
      {/* Section Title */}
      <h4 className="mb-4 text-sm font-bold text-gray-900">
        Next Bus Departures
      </h4>

      {/* Departure List */}
      {schedules.length === 0 ? (
        <div className="text-sm text-gray-500 text-center">No upcoming departures found.</div>
      ) : (
        <ExpandableList
          items={schedules}
          initialCount={3}
          showMoreLabel="View All Departures"
          showLessLabel="Show Fewer Departures"
        >
          {(visibleSchedules) => (
            <div className="space-y-4">
              {visibleSchedules.map((schedule, idx) => (
                <div
                  key={schedule._id}
                  className="flex items-center justify-between text-sm"
                >
                  {/* Left */}
                  <div className="text-gray-600">
                    Route{" "}
                    <span className="font-semibold text-gray-900">
                      {schedule.route?.routeNo}
                    </span>
                    <span className="ml-1 text-xs text-gray-500">
                      ({formatRouteName(schedule.route?.from, schedule.route?.to)})
                    </span>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {schedule.firstBus}
                    </span>

                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                        idx === 0
                          ? "border-green-100 bg-green-50 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-600"
                      }`}
                    >
                      {schedule.frequency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ExpandableList>
      )}
    </div>
  );
};

export default NextDepartures;