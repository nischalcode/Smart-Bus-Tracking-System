import TrackingModel from "./TrackingModel.js";
import type { ITracking } from "./TrackingModel.js";
import RouteModel from "../routes/RouteModel.js";
import ScheduleModel from "../schedules/ScheduleModel.js";
import { toObjectIdString } from "../../utils/mongoose.js";
import {
  type Coord,
  coordDistance,
  distanceAlongPath,
  formatDuration,
  interpolateAlongPath,
  projectPointToPath,
  weightedMovingAverage,
} from "../../utils/geo.js";

const SPEED_HISTORY_LIMIT = 5;
const STOPPED_THRESHOLD_KMH = 2;
const DELAYED_THRESHOLD_SECONDS = 180;
const SIMULATOR_INTERVAL_SECONDS = 10;
const DEFAULT_SPEED_KMH = 25;

interface StopInfo {
  name: string;
  coordinateIndex: number;
  timeOffset?: number;
}

function parseTimeString(timeStr?: string): Date | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  const hourStr = match[1];
  const minuteStr = match[2];
  const period = match[3];
  if (!hourStr || !minuteStr || !period) return null;

  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  const upperPeriod = period.toUpperCase();
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (upperPeriod === "PM" && hours !== 12) hours += 12;
  if (upperPeriod === "AM" && hours === 12) hours = 0;

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
}

function buildStopsWithIndexes(stops: Array<{ name?: string; timeOffset?: number; type?: string }>, pathLength: number): StopInfo[] {
  const namedStops = stops
    .map((s) => ({
      name: s.name?.trim() ?? "",
      timeOffset: s.timeOffset ?? 0,
    }))
    .filter((s) => s.name.length > 0);

  if (namedStops.length === 0) {
    return [
      { name: "Start", coordinateIndex: 0 },
      { name: "End", coordinateIndex: Math.max(0, pathLength - 1) },
    ];
  }

  if (namedStops.length === 1) {
    return [
      { name: namedStops[0]?.name ?? "Stop", coordinateIndex: 0 },
      { name: "End", coordinateIndex: Math.max(0, pathLength - 1) },
    ];
  }

  return namedStops.map((stop, i) => ({
    name: stop.name,
    timeOffset: stop.timeOffset,
    coordinateIndex: Math.round((i / (namedStops.length - 1)) * (pathLength - 1)),
  }));
}

function computeBearing(from: Coord, to: Coord): number {
  const dLng = ((to[1] - from[1]) * Math.PI) / 180;
  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

function findNextStop(stops: StopInfo[], currentIndex: number): StopInfo | null {
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (stop && stop.coordinateIndex > currentIndex) {
      return stop;
    }
  }
  return null;
}

function findFinalStop(stops: StopInfo[]): StopInfo {
  return stops[stops.length - 1] ?? { name: "End", coordinateIndex: 0 };
}

async function getScheduledEtaSeconds(
  busId: string,
  routeId: string,
  stopTimeOffset: number
): Promise<number | null> {
  const schedule = await ScheduleModel.findOne({ bus: busId, route: routeId }).lean();
  if (!schedule) return null;
  const firstBusTime = parseTimeString(schedule.firstBus as string | undefined);
  if (!firstBusTime) return null;
  const scheduledArrival = new Date(firstBusTime.getTime() + stopTimeOffset * 60_000);
  const diffSeconds = (scheduledArrival.getTime() - Date.now()) / 1000;
  return diffSeconds > 0 ? diffSeconds : null;
}

async function determineStatus(
  speedKmh: number,
  actualEtaSeconds: number,
  nextStopTimeOffset: number | undefined,
  busId: string,
  routeId: string
): Promise<string> {
  if (speedKmh < STOPPED_THRESHOLD_KMH) {
    return "Stopped";
  }

  if (typeof nextStopTimeOffset === "number") {
    const scheduledEta = await getScheduledEtaSeconds(busId, routeId, nextStopTimeOffset);
    if (scheduledEta !== null && actualEtaSeconds > scheduledEta + DELAYED_THRESHOLD_SECONDS) {
      return "Delayed";
    }
  }

  return "On Time";
}

export interface ProcessedTrackingUpdate {
  latitude: number;
  longitude: number;
  speed: number;
  speedHistory: number[];
  heading: number;
  distanceTraveled: number;
  currentIndex: number;
  nextStop: string;
  nextStopEtaSeconds: number;
  eta: string;
  status: string;
}

export async function processTrackingFromLocation(
  tracking: ITracking,
  rawLocation: Coord,
  now: Date
): Promise<ProcessedTrackingUpdate | null> {
  const routeId = toObjectIdString(tracking.route);
  if (!routeId) return null;
  const route = await RouteModel.findById(routeId).lean();
  if (!route || !Array.isArray(route.pathCoordinates) || route.pathCoordinates.length < 2) {
    return null;
  }

  const path = route.pathCoordinates as unknown as Coord[];
  const stops = buildStopsWithIndexes(route.stops as Array<{ name?: string; timeOffset?: number; type?: string }>, path.length);

  const previous: Coord = [tracking.latitude, tracking.longitude];
  const projected = projectPointToPath(rawLocation, path);
  const distanceMoved = coordDistance(previous, projected.point);

  const dtHours = tracking.createdAt
    ? (now.getTime() - new Date(tracking.updatedAt ?? tracking.createdAt).getTime()) / 3_600_000
    : 0;

  let instantaneousSpeed = 0;
  if (dtHours > 0 && distanceMoved > 0.001) {
    instantaneousSpeed = distanceMoved / dtHours;
  }

  const history: number[] = tracking.speedHistory?.slice(-SPEED_HISTORY_LIMIT + 1) ?? [];
  if (instantaneousSpeed > 0) {
    history.push(instantaneousSpeed);
  } else if (history.length === 0) {
    history.push(0);
  }

  const smoothedSpeed = instantaneousSpeed > 0
    ? weightedMovingAverage(history)
    : weightedMovingAverage(history) || DEFAULT_SPEED_KMH;

  const heading = computeBearing(previous, projected.point);

  const cumulativeDistances = stops.map((s) => distanceAlongPath(path, 0, s.coordinateIndex));
  const nextStop = findNextStop(stops, projected.index);
  const finalStop = findFinalStop(stops);

  const nextStopDistance = nextStop
    ? Math.max(0, (cumulativeDistances[stops.indexOf(nextStop)] ?? 0) - distanceAlongPath(path, 0, projected.index))
    : 0;
  const finalStopDistance = Math.max(
    0,
    (cumulativeDistances[stops.indexOf(finalStop)] ?? 0) - distanceAlongPath(path, 0, projected.index)
  );

  const nextStopEtaSeconds = smoothedSpeed > 0 ? Math.round((nextStopDistance / smoothedSpeed) * 3600) : 0;
  const finalEtaSeconds = smoothedSpeed > 0 ? Math.round((finalStopDistance / smoothedSpeed) * 3600) : 0;

  const busId = toObjectIdString(tracking.bus) ?? "";
  const routeIdForStatus = toObjectIdString(route._id) ?? "";
  const status = await determineStatus(
    smoothedSpeed,
    nextStopEtaSeconds,
    nextStop?.timeOffset,
    busId,
    routeIdForStatus
  );

  return {
    latitude: projected.point[0],
    longitude: projected.point[1],
    speed: Math.round(smoothedSpeed * 10) / 10,
    speedHistory: history.slice(-SPEED_HISTORY_LIMIT),
    heading: Math.round(heading),
    distanceTraveled: tracking.distanceTraveled + distanceMoved,
    currentIndex: projected.index,
    nextStop: nextStop?.name ?? finalStop.name,
    nextStopEtaSeconds,
    eta: formatDuration(finalEtaSeconds),
    status,
  };
}

export function processTrackingSimulationStep(
  tracking: ITracking,
  routePath: Coord[]
): ProcessedTrackingUpdate | null {
  if (routePath.length < 2) return null;

  const stops = buildStopsWithIndexes([], routePath.length);

  const distanceSoFar = tracking.distanceTraveled ?? 0;
  const intervalHours = SIMULATOR_INTERVAL_SECONDS / 3600;
  const baseSpeed = 20 + Math.random() * 25;
  const targetDistance = distanceSoFar + baseSpeed * intervalHours;

  const { point, index } = interpolateAlongPath(routePath, targetDistance);
  const distanceMoved = distanceSoFar > 0 ? targetDistance - distanceSoFar : 0;

  const instantaneousSpeed = distanceMoved / intervalHours;
  const history: number[] = tracking.speedHistory?.slice(-SPEED_HISTORY_LIMIT + 1) ?? [];
  history.push(instantaneousSpeed);
  const smoothedSpeed = weightedMovingAverage(history.slice(-SPEED_HISTORY_LIMIT)) || baseSpeed;

  const previous: Coord = [tracking.latitude, tracking.longitude];
  const heading = computeBearing(previous, point);

  const cumulativeDistances = stops.map((s) => distanceAlongPath(routePath, 0, s.coordinateIndex));
  const nextStop = findNextStop(stops, index);
  const finalStop = findFinalStop(stops);

  const nextStopDistance = nextStop
    ? Math.max(0, (cumulativeDistances[stops.indexOf(nextStop)] ?? 0) - distanceAlongPath(routePath, 0, index))
    : 0;
  const finalStopDistance = Math.max(
    0,
    (cumulativeDistances[stops.indexOf(finalStop)] ?? 0) - distanceAlongPath(routePath, 0, index)
  );

  const nextStopEtaSeconds = smoothedSpeed > 0 ? Math.round((nextStopDistance / smoothedSpeed) * 3600) : 0;
  const finalEtaSeconds = smoothedSpeed > 0 ? Math.round((finalStopDistance / smoothedSpeed) * 3600) : 0;

  return {
    latitude: point[0],
    longitude: point[1],
    speed: Math.round(smoothedSpeed * 10) / 10,
    speedHistory: history.slice(-SPEED_HISTORY_LIMIT),
    heading: Math.round(heading),
    distanceTraveled: targetDistance,
    currentIndex: index,
    nextStop: nextStop?.name ?? finalStop.name,
    nextStopEtaSeconds,
    eta: formatDuration(finalEtaSeconds),
    status: smoothedSpeed < STOPPED_THRESHOLD_KMH ? "Stopped" : "On Time",
  };
}

export async function updateTrackingDocument(
  trackingId: string,
  update: ProcessedTrackingUpdate
): Promise<ITracking | null> {
  return TrackingModel.findByIdAndUpdate(
    trackingId,
    {
      latitude: update.latitude,
      longitude: update.longitude,
      speed: update.speed,
      speedHistory: update.speedHistory,
      heading: update.heading,
      distanceTraveled: update.distanceTraveled,
      currentIndex: update.currentIndex,
      nextStop: update.nextStop,
      nextStopEtaSeconds: update.nextStopEtaSeconds,
      eta: update.eta,
      status: update.status,
    },
    { new: true }
  );
}
