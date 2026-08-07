import RouteModel from "../routes/RouteModel.js";
import ScheduleModel from "../schedules/ScheduleModel.js";
import TrackingModel from "../tracking/TrackingModel.js";
import NotificationService from "./NotificationService.js";
import { notificationEventConfig } from "./NotificationEventConfig.js";

const notificationService = new NotificationService();

function etaMinutes(value?: string): number | null {
  const match = value?.match(/\d+/);
  return match?.[0] ? Number(match[0]) : null;
}

function scheduleTimeToday(value: string): Date | null {
  const match = value.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  if (!match?.[1] || !match[2]) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (match[3]?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (match[3]?.toUpperCase() === "AM" && hours === 12) hours = 0;
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
}

/** Observes persisted telemetry; it never changes tracking, trip, or schedule data. */
export class EventDetectionService {
  private lastEtaByBus = new Map<string, number>();
  private monitor: NodeJS.Timeout | undefined;
  private monitoring = false;

  async tripStarted(trip: any, bus: any, route: any): Promise<void> {
    await notificationService.createSystemNotification({
      eventType: "trip_started", eventKey: `trip_started:${trip._id}`,
      title: "Bus started its trip",
      description: `${bus.busNumber} has started Route ${route?.routeNo ?? ""} (${route?.from ?? ""} - ${route?.to ?? ""}).`,
      recipientRoles: ["passenger", "driver", "admin"], bus: bus._id, route: route?._id ?? trip.route, driver: trip.driver,
      cooldownMinutes: 24 * 60,
    });
  }

  async tripCompleted(trip: any, bus: any, route: any): Promise<void> {
    await notificationService.createSystemNotification({
      eventType: "trip_completed", eventKey: `trip_completed:${trip._id}`,
      title: "Bus completed its trip", description: `${bus?.busNumber ?? "Bus"} completed Route ${route?.routeNo ?? ""}.`,
      recipientRoles: ["passenger", "driver", "admin"], bus: trip.bus, route: trip.route, driver: trip.driver,
      cooldownMinutes: 24 * 60,
    });
  }

  async telemetryReceived(tracking: any, bus: any): Promise<void> {
    const route = await RouteModel.findById(tracking.route ?? tracking.routeId).lean();
    if (!route) return;
    const busLabel = bus?.busNumber ?? tracking.busNo ?? "Bus";
    const busKey = String(tracking.bus ?? tracking.busId);
    const eta = etaMinutes(tracking.eta);
    const previousEta = this.lastEtaByBus.get(busKey);
    if (eta !== null) this.lastEtaByBus.set(busKey, eta);

    if (tracking.nextStop && tracking.nextStop !== "N/A" && tracking.nextStop !== "Route End" && eta !== null && eta > 0 && eta <= notificationEventConfig.approachingEtaMinutes) {
      await this.notify("bus_approaching_stop", `approaching:${busKey}:${tracking.nextStop}`, "Bus approaching stop",
        `${busLabel} will reach ${tracking.nextStop} in about ${eta} min.`, ["passenger", "driver"], tracking, route, 5);
    }

    const hasArrived = tracking.currentStop && tracking.currentStop !== "N/A" && tracking.currentStop !== "Not at any stop" &&
      (tracking.atStop || Number(tracking.distanceToNextStop) <= notificationEventConfig.arrivalDistanceKm || tracking.eta === "Arrived");
    if (hasArrived) {
      await this.notify("bus_arrived_stop", `arrived:${busKey}:${tracking.currentStop}`, "Bus arrived at stop",
        `${busLabel} has arrived at ${tracking.currentStop}.`, ["passenger", "driver"], tracking, route, 10);
    }

    const etaIncreased = previousEta !== undefined && eta !== null && eta - previousEta >= notificationEventConfig.delayThresholdMinutes;
    const schedule = await ScheduleModel.findOne({ bus: tracking.bus ?? tracking.busId, route: route._id, active: true }).lean();
    const scheduleReportsDelay = Boolean(schedule?.status?.toLowerCase().includes("delay"));
    if (etaIncreased || scheduleReportsDelay || tracking.status?.toLowerCase().includes("delay")) {
      await this.notify("bus_delayed", `delayed:${busKey}`, "Bus delay detected",
        `${busLabel} on Route ${route.routeNo} is delayed. Updated ETA: ${tracking.eta ?? "N/A"}.`, ["passenger", "driver", "admin"], tracking, route, 10, "Alert", "TriangleAlert");
    }

    const trafficEtaIncrease = previousEta !== undefined && eta !== null && eta - previousEta >= notificationEventConfig.trafficEtaIncreaseMinutes;
    if (Number(tracking.speed) > 0 && Number(tracking.speed) <= notificationEventConfig.trafficSpeedKph && trafficEtaIncrease) {
      await this.notify("heavy_traffic", `heavy_traffic:${busKey}`, "Heavy traffic detected",
        `${busLabel} is moving at ${tracking.speed} km/h on Route ${route.routeNo}; ETA has increased.`, ["passenger", "driver", "admin"], tracking, route, 10, "Alert", "TriangleAlert");
    }
  }

  /** Future integrations can call this without adding a second notification path. */
  async emergency(input: { bus?: unknown; route?: unknown; driver?: unknown; description: string }): Promise<void> {
    await notificationService.createSystemNotification({
      eventType: "emergency", eventKey: `emergency:${String(input.bus ?? input.route ?? Date.now())}`,
      title: "Emergency alert", description: input.description, recipientRoles: ["passenger", "driver", "admin"],
      bus: input.bus, route: input.route, driver: input.driver, cooldownMinutes: 1, badge: "Alert", icon: "TriangleAlert",
    });
  }

  /** Re-check immediately after an administrator changes a schedule. */
  async scheduleChanged(): Promise<void> {
    await this.checkOperationalEvents();
  }

  startMonitoring(): void {
    if (this.monitor) return;
    const run = () => void this.checkOperationalEvents().catch((error) => console.error("Notification event monitor failed:", error));
    run();
    this.monitor = setInterval(run, notificationEventConfig.monitorIntervalMinutes * 60_000);
    this.monitor.unref();
  }

  stopMonitoring(): void {
    if (this.monitor) clearInterval(this.monitor);
    this.monitor = undefined;
  }

  private async notify(eventType: string, eventKey: string, title: string, description: string, recipientRoles: ("passenger" | "driver" | "admin")[], tracking: any, route: any, cooldownMinutes: number, badge?: string, icon?: string): Promise<void> {
    await notificationService.createSystemNotification({
      eventType, eventKey, title, description, recipientRoles, bus: tracking.bus,
      route: route._id, driver: tracking.driverId, cooldownMinutes,
      ...(badge ? { badge } : {}),
      ...(icon ? { icon } : {}),
    });
  }

  private async checkOperationalEvents(): Promise<void> {
    if (this.monitoring) return;
    this.monitoring = true;
    try {
      const staleBefore = new Date(Date.now() - notificationEventConfig.offlineTimeoutMinutes * 60_000);
      const schedules = await ScheduleModel.find({ active: true }).lean();
      const activeRoutes = await RouteModel.find({ active: true }).lean();
      const grouped = new Map<string, any[]>();
      for (const schedule of schedules) {
        const key = String(schedule.route);
        grouped.set(key, [...(grouped.get(key) ?? []), schedule]);
      }
      // A route can be active before its first schedule is created; it still
      // needs a route-status notification when no bus is reporting GPS data.
      for (const route of activeRoutes) {
        const key = String(route._id);
        if (!grouped.has(key)) grouped.set(key, []);
      }
      for (const [routeId, routeSchedules] of grouped) {
        const route = activeRoutes.find((item) => String(item._id) === routeId) ?? await RouteModel.findById(routeId).lean();
        if (!route) continue;
        let activeBusFound = false;
        if (routeSchedules.length === 0) {
          const tracking = await TrackingModel.findOne({ $or: [{ route: route._id }, { routeId: route._id }] }).sort({ timestamp: -1 }).lean();
          const lastUpdate = tracking?.timestamp ?? tracking?.updatedAt;
          activeBusFound = Boolean(lastUpdate && new Date(lastUpdate) >= staleBefore);
        }
        for (const schedule of routeSchedules) {
          const tracking = await TrackingModel.findOne({ $or: [{ bus: schedule.bus }, { busId: schedule.bus }] }).sort({ timestamp: -1 }).lean();
          const lastUpdate = tracking?.timestamp ?? tracking?.updatedAt;
          const isFresh = Boolean(lastUpdate && new Date(lastUpdate) >= staleBefore);
          if (isFresh) activeBusFound = true;
          const start = scheduleTimeToday(schedule.firstBus);
          if (start && Date.now() > start.getTime() && !isFresh) {
            await notificationService.createSystemNotification({
              eventType: "driver_offline", eventKey: `driver_offline:${String(schedule.bus)}`,
              title: "Driver location offline", description: `No GPS telemetry has been received for Route ${route.routeNo} in over ${notificationEventConfig.offlineTimeoutMinutes} minutes.`,
              recipientRoles: ["admin"], bus: schedule.bus, route: route._id, driver: tracking?.driverId,
              cooldownMinutes: notificationEventConfig.offlineTimeoutMinutes, badge: "Alert", icon: "CircleX",
            });
          }
        }
        if (!activeBusFound) {
          await notificationService.createSystemNotification({
            eventType: "route_unavailable", eventKey: `route_unavailable:${routeId}`,
            title: "Route temporarily unavailable", description: `There are currently no active buses reporting on Route ${route.routeNo}.`,
            recipientRoles: ["passenger", "admin"], route: route._id, cooldownMinutes: notificationEventConfig.offlineTimeoutMinutes,
            badge: "Alert", icon: "CircleX",
          });
        }
      }
    } finally {
      this.monitoring = false;
    }
  }
}

export const eventDetectionService = new EventDetectionService();
export default EventDetectionService;
