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
 * Calculates Estimated Time of Arrival (ETA) in minutes and formatted string.
 * Formula: ETA (minutes) = (Remaining Distance / Speed) * 60
 * Handles speed <= 0 with sensible fallback speed (e.g. 20 km/h) and clamps unreasonable values.
 */
export function calculateETA(
  distanceKm: number,
  speedKmH: number,
  fallbackSpeedKmH: number = 20
): { minutes: number; text: string } {
  if (distanceKm <= 0.03) {
    return { minutes: 0, text: "Arrived" };
  }

  // Use sensible speed fallback if speed is zero or unreasonably low (< 5 km/h)
  const effectiveSpeed = speedKmH >= 5 ? Math.min(speedKmH, 80) : fallbackSpeedKmH;
  const minutes = Math.ceil((distanceKm / effectiveSpeed) * 60);

  // Cap unrealistic ETA values to 12 hours (720 min)
  const cappedMinutes = Math.min(minutes, 720);
  return {
    minutes: cappedMinutes,
    text: `${cappedMinutes} min`,
  };
}

/**
 * Checks if current GPS position deviates from the assigned polyline route.
 * Computes minimum perpendicular distance from bus position to each route segment.
 * Threshold defaults to 0.1 km (100 meters).
 */
export function checkRouteDeviation(
  busLat: number,
  busLon: number,
  routeCoordinates: number[][],
  thresholdKm: number = 0.1
): { isDeviated: boolean; distanceKm: number } {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return { isDeviated: false, distanceKm: 0 };
  }

  const firstPoint = routeCoordinates[0];
  if (
    routeCoordinates.length === 1 &&
    firstPoint &&
    typeof firstPoint[0] === "number" &&
    typeof firstPoint[1] === "number"
  ) {
    const dist = calculateHaversineDistance(
      busLat,
      busLon,
      firstPoint[0],
      firstPoint[1]
    );
    return { isDeviated: dist > thresholdKm, distanceKm: dist };
  }

  let minDistance = Number.MAX_VALUE;

  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const p1 = routeCoordinates[i];
    const p2 = routeCoordinates[i + 1];
    if (
      !p1 ||
      !p2 ||
      typeof p1[0] !== "number" ||
      typeof p1[1] !== "number" ||
      typeof p2[0] !== "number" ||
      typeof p2[1] !== "number"
    ) {
      continue;
    }

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((busLat - p1[0]) * dx + (busLon - p1[1]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLat = p1[0] + t * dx;
    const projLon = p1[1] + t * dy;

    const dist = calculateHaversineDistance(busLat, busLon, projLat, projLon);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return {
    isDeviated: minDistance > thresholdKm,
    distanceKm: minDistance === Number.MAX_VALUE ? 0 : minDistance,
  };
}

/**
 * Lightweight GPS smoothing using Exponential Moving Average (EMA).
 * Reduces jitter/noise while maintaining real-time responsiveness without noticeable delay.
 */
export function smoothGpsCoordinates(
  prevLat: number,
  prevLon: number,
  currLat: number,
  currLon: number,
  prevTime?: number | Date,
  currTime?: number | Date,
  alpha: number = 0.8
): { latitude: number; longitude: number } {
  // If time gap is large (> 60s) or no valid previous point, use raw coordinate
  if (prevTime && currTime) {
    const timeDiffMs = Math.abs(new Date(currTime).getTime() - new Date(prevTime).getTime());
    if (timeDiffMs > 60_000) {
      return { latitude: currLat, longitude: currLon };
    }
  }

  // If distance moved is very small (< 3 meters), clamp to avoid stationary jitter
  const distanceKm = calculateHaversineDistance(prevLat, prevLon, currLat, currLon);
  if (distanceKm < 0.003) {
    return { latitude: prevLat, longitude: prevLon };
  }

  // If jump is massive (> 1km), don't smooth across anomaly
  if (distanceKm > 1.0) {
    return { latitude: currLat, longitude: currLon };
  }

  const smoothedLat = alpha * currLat + (1 - alpha) * prevLat;
  const smoothedLon = alpha * currLon + (1 - alpha) * prevLon;

  return {
    latitude: Math.round(smoothedLat * 1e6) / 1e6,
    longitude: Math.round(smoothedLon * 1e6) / 1e6,
  };
}
