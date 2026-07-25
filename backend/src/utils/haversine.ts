/**
 * Calculates distance between two GPS coordinates in kilometers using the Haversine formula.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

/**
 * Calculates speed in km/h based on two consecutive tracking points.
 * Applies safety filters:
 * - If speed < 0, set to 0.
 * - If speed > 120 km/h, ignores as GPS anomaly and uses previous speed (or 0).
 */
export function calculateSpeed(
  prevLat: number,
  prevLon: number,
  prevTime: number | Date,
  currLat: number,
  currLon: number,
  currTime: number | Date,
  prevSpeed: number = 0
): number {
  const time1 = new Date(prevTime).getTime();
  const time2 = new Date(currTime).getTime();

  const timeDiffHours = (time2 - time1) / (1000 * 60 * 60);

  // If time difference is invalid or too small (< 1 second)
  if (timeDiffHours <= 0) {
    return 0;
  }

  const distanceKm = calculateHaversineDistance(prevLat, prevLon, currLat, currLon);
  let speedKmH = distanceKm / timeDiffHours;

  // Speed Filtering logic:
  if (speedKmH < 0) {
    speedKmH = 0;
  } else if (speedKmH > 120) {
    // GPS jitter artifact / anomaly: use previous speed or fallback to 0
    speedKmH = prevSpeed > 0 && prevSpeed <= 120 ? prevSpeed : 0;
  }

  return Math.round(speedKmH * 10) / 10; // Rounded to 1 decimal place
}

/**
 * Calculates distance in meters between two GPS coordinates using Haversine formula.
 * Returns distance in meters (more precise for short distances).
 */
export function calculateHaversineDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateHaversineDistance(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Detects if a bus is within a specified radius of a stop (geofencing).
 * Returns true if bus is within radiusMeters of the stop.
 */
export function isWithinGeofence(
  busLat: number,
  busLng: number,
  stopLat: number,
  stopLng: number,
  radiusMeters: number = 30
): boolean {
  const distanceMeters = calculateHaversineDistanceInMeters(
    busLat,
    busLng,
    stopLat,
    stopLng
  );
  return distanceMeters <= radiusMeters;
}

/**
 * Calculates estimated time of arrival (ETA) in minutes.
 * Based on remaining distance and current speed.
 * Returns minutes, or null if speed is 0.
 */
export function calculateETA(
  distanceKm: number,
  speedKmH: number
): number | null {
  if (speedKmH <= 0) return null;
  const hoursToDestination = distanceKm / speedKmH;
  const minutesToDestination = hoursToDestination * 60;
  return Math.round(minutesToDestination);
}

/**
 * Formats ETA in minutes to a human-readable string.
 */
export function formatETA(minutesToArrival: number | null): string {
  if (minutesToArrival === null) return "N/A";
  if (minutesToArrival < 1) return "< 1 min";
  if (minutesToArrival === 1) return "1 min";
  return `${minutesToArrival} min`;
}

/**
 * Stable geofence detection with proper state tracking.
 * 
 * Rules:
 * - Bus enters geofence → that stop becomes currentStop, previous = old current
 * - Bus exits geofence → currentStop becomes previousStop, state stays until next geofence
 * - Between geofences: state does NOT change (prevents rapid switching from GPS noise)
 * - Only advances forward along the route (never goes back to earlier stops)
 */
export function updateGeofenceStatus(
  busLat: number,
  busLng: number,
  stops: Array<{ lat: number; lng: number; name?: string }>,
  previousCurrentStopIndex: number = -1,
  geofenceRadiusMeters: number = 30
): {
  currentStopIndex: number;
  nextStopIndex: number;
  previousStopIndex: number;
} {
  if (!stops || stops.length === 0) {
    return { currentStopIndex: -1, nextStopIndex: -1, previousStopIndex: -1 };
  }

  // Step 1: Check if bus is currently inside ANY stop's geofence
  let enteredStopIndex = -1;
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (stop && isWithinGeofence(busLat, busLng, stop.lat, stop.lng, geofenceRadiusMeters)) {
      enteredStopIndex = i;
      break; // Take the first (earliest in route) matching stop
    }
  }

  let currentStopIndex = previousCurrentStopIndex;

  if (enteredStopIndex >= 0) {
    // Bus is inside a geofence
    if (previousCurrentStopIndex < 0) {
      // First stop ever visited
      currentStopIndex = enteredStopIndex;
    } else if (enteredStopIndex > previousCurrentStopIndex) {
      // Entered a new stop further along the route (advance only)
      currentStopIndex = enteredStopIndex;
    }
    // If enteredStopIndex === previousCurrentStopIndex, stay (still at same stop)
    // If enteredStopIndex < previousCurrentStopIndex, ignore (don't go backward)
  }
  // If no geofence hit (enteredStopIndex === -1): keep currentStopIndex unchanged
  // This is the key stability mechanism - between stops, state doesn't change

  // Calculate previous and next based on currentStopIndex
  const previousStopIndex = currentStopIndex > 0 ? currentStopIndex - 1 : -1;
  const nextStopIndex = currentStopIndex + 1 < stops.length ? currentStopIndex + 1 : -1;

  return {
    currentStopIndex: currentStopIndex >= 0 ? currentStopIndex : -1,
    nextStopIndex,
    previousStopIndex,
  };
}
