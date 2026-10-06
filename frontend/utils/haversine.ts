export function haversineKm([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function routeDistanceKm(coords: [number, number][]) {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    if (prev && curr) {
      total += haversineKm(prev, curr);
    }
  }
  return total;
}

export function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

/**
 * Calculates Estimated Time of Arrival (ETA).
 * Formula: ETA = (Remaining Distance / Speed) * 60 minutes
 * Handles speed <= 0 safely using sensible city speed fallback, prevents unrealistic values.
 */
export function calculateETA(
  distanceKm: number,
  speedKmh?: number,
  fallbackSpeedKmh: number = 20
): string {
  if (distanceKm <= 0.03) return "Arrived"; // within 30m geofence

  // Use sensible speed fallback when stationary (< 5 km/h) or invalid
  const effectiveSpeed = speedKmh && speedKmh >= 5 ? Math.min(speedKmh, 80) : fallbackSpeedKmh;
  const totalSeconds = (distanceKm / effectiveSpeed) * 3600;

  if (totalSeconds < 60) {
    return `${Math.max(1, Math.round(totalSeconds))} sec`;
  }

  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);

  // Avoid unrealistic long times
  if (mins >= 180) {
    const hours = (mins / 60).toFixed(1);
    return `${hours} hrs`;
  }

  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${secs} sec`;
}

/**
 * Checks whether a bus position has deviated from the route polyline.
 * Computes minimum perpendicular distance from bus to any route segment.
 * Threshold defaults to 0.1 km (100 meters).
 */
export function checkRouteDeviation(
  busPosition: [number, number],
  routeCoords: [number, number][],
  thresholdKm: number = 0.1
): { isDeviated: boolean; distanceKm: number } {
  if (!routeCoords || routeCoords.length === 0) {
    return { isDeviated: false, distanceKm: 0 };
  }

  const firstPoint = routeCoords[0];
  if (routeCoords.length === 1 && firstPoint) {
    const dist = haversineKm(busPosition, firstPoint);
    return { isDeviated: dist > thresholdKm, distanceKm: dist };
  }

  let minDistance = Number.MAX_VALUE;

  for (let i = 0; i < routeCoords.length - 1; i++) {
    const p1 = routeCoords[i];
    const p2 = routeCoords[i + 1];
    if (!p1 || !p2) continue;

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((busPosition[0] - p1[0]) * dx + (busPosition[1] - p1[1]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLat = p1[0] + t * dx;
    const projLng = p1[1] + t * dy;
    const dist = haversineKm(busPosition, [projLat, projLng]);

    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return {
    isDeviated: minDistance > thresholdKm,
    distanceKm: minDistance === Number.MAX_VALUE ? 0 : minDistance,
  };
}
