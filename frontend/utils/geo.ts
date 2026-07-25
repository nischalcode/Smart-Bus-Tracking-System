/**
 * Frontend Haversine distance & ETA utilities.
 * Mirrors backend/src/utils/haversine.ts for client-side calculations.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two GPS coordinates in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Haversine distance in meters.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Calculate ETA in minutes given distance (km) and speed (km/h).
 * Returns null if speed is 0 or negative.
 */
export function calculateETA(distanceKm: number, speedKmH: number): number | null {
  if (speedKmH <= 0) return null;
  const hours = distanceKm / speedKmH;
  return Math.round(hours * 60);
}

/**
 * Format distance for display (m or km).
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format ETA for display.
 */
export function formatETA(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "N/A";
  if (minutes < 1) return "< 1 min";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
}

/**
 * Compute distance from bus to each named stop.
 * Returns an array of { stop, distanceMeters } sorted by distance ascending.
 */
export function computeStopDistances(
  busLat: number,
  busLng: number,
  stops: Array<{ name: string; lat: number; lng: number }>
): Array<{ name: string; lat: number; lng: number; distanceMeters: number }> {
  return stops
    .map((stop) => ({
      ...stop,
      distanceMeters: haversineDistanceMeters(busLat, busLng, stop.lat, stop.lng),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
