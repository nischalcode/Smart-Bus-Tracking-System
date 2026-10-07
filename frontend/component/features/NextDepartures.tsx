import type { ScheduleData } from "@/utils/api";
import { formatRouteName } from "@/utils/routeFormatter";

interface NextDeparturesProps {
  schedules: ScheduleData[];
}

import ExpandableList from "@/component/ui/ExpandableList";

const NextDepartures = ({ schedules }: NextDeparturesProps) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h4 className="mb-4 text-sm font-bold text-foreground">
        Scheduled Service Windows
      </h4>

      {schedules.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">
          No active schedules found.
        </div>
      ) : (
        <ExpandableList
          items={schedules}
          initialCount={3}
          showMoreLabel="View All Departures"
          showLessLabel="Show Fewer Departures"
        >
          {(visibleSchedules) => (
            <div className="space-y-4">
              {visibleSchedules.map((schedule) => (
                <div
                  key={schedule._id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <div className="min-w-0 text-muted-foreground">
                    Route{" "}
                    <span className="font-semibold text-foreground">
                      {schedule.route?.routeNo}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({formatRouteName(schedule.route?.from, schedule.route?.to)})
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium text-foreground">
                      {schedule.firstBus}–{schedule.lastBus}
                    </span>

                    <span
                      className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
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