/**
 * Runtime configuration for automatic notification detection. Environment
 * variables keep the existing database schema and admin UI unchanged.
 */
function positiveNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const notificationEventConfig = {
  approachingEtaMinutes: positiveNumber("NOTIFICATION_ETA_THRESHOLD_MINUTES", 3),
  arrivalDistanceKm: positiveNumber("NOTIFICATION_ARRIVAL_DISTANCE_METERS", 30) / 1000, // 30m geofence
  offlineTimeoutMinutes: positiveNumber("NOTIFICATION_OFFLINE_TIMEOUT_MINUTES", 10),
  delayThresholdMinutes: positiveNumber("NOTIFICATION_DELAY_THRESHOLD_MINUTES", 10),
  trafficSpeedKph: positiveNumber("NOTIFICATION_TRAFFIC_SPEED_KPH", 15),
  trafficEtaIncreaseMinutes: positiveNumber("NOTIFICATION_TRAFFIC_ETA_INCREASE_MINUTES", 5),
  monitorIntervalMinutes: positiveNumber("NOTIFICATION_MONITOR_INTERVAL_MINUTES", 1),
};
