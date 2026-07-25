import { calculateHaversineDistance } from "./haversine.js";

export interface StopCoordinate {
  _id?: string;
  name: string;
  lat: number;
  lng: number;
}

export interface UpcomingStopPrediction {
  stopId: string;
  name: string;
  distanceKm: number;
  etaString: string;
}

export interface TrackingEnrichmentResult {
  upcomingStops: UpcomingStopPrediction[];
  currentStop: string | null;
  nextStop: string | null;
  isStopped: boolean;
}

/**
 * Calculates direction-aware stops, geofences, and ETAs.
 *
 * @param currentLat Current latitude of the bus
 * @param currentLng Current longitude of the bus
 * @param speed Current speed of the bus (km/h)
 * @param direction "Going" or "Coming"
 * @param allStops All stops on the route
 * @param currentIndex Approximate current index in the route coordinates (useful for filtering if needed, though Haversine is used here)
 */
export function enrichTrackingData(
  currentLat: number,
  currentLng: number,
  speed: number,
  direction: string,
  allStops: StopCoordinate[]
): TrackingEnrichmentResult {
  // 1. Direction-Aware Filtering
  let activeStops = [...allStops];
  if (direction === "Coming") {
    activeStops.reverse();
  }

  // 2. Determine distances and filter passed stops
  const GEOFENCE_RADIUS_KM = 0.03;
  let closestStopIdx = -1;
  let minDistance = Infinity;

  const stopDistances = activeStops.map((stop, idx) => {
    const dist = calculateHaversineDistance(currentLat, currentLng, stop.lat, stop.lng);
    return { stop, dist, idx };
  });

  stopDistances.forEach(item => {
    if (item.dist < minDistance) {
      minDistance = item.dist;
      closestStopIdx = item.idx;
    }
  });

  let activeStartIndex = closestStopIdx;

  // Law of Cosines: Determine if the bus is AHEAD of the closest stop (i.e., has passed it)
  // If the angle between (ClosestStop -> NextStop) and (ClosestStop -> Bus) is acute, 
  // it means the bus is located forward along the route segment.
  if (closestStopIdx >= 0 && closestStopIdx < activeStops.length - 1 && minDistance > GEOFENCE_RADIUS_KM) {
    const C = activeStops[closestStopIdx];
    const nextStop = activeStops[closestStopIdx + 1];
    
    const a = calculateHaversineDistance(C.lat, C.lng, nextStop.lat, nextStop.lng);
    const b = minDistance; // Distance from C to Bus
    const c = calculateHaversineDistance(currentLat, currentLng, nextStop.lat, nextStop.lng);
    
    // a^2 + b^2 - c^2 > 0 implies an acute angle.
    if (a * a + b * b - c * c > 0) {
      activeStartIndex = closestStopIdx + 1; // Bus has departed C and is heading to nextStop
    }
  }

  // Filter out stops that are strictly before the logical active start index
  let upcomingStopsData = stopDistances.filter(item => item.idx >= activeStartIndex);

  // 3. Geofencing (30 meters = 0.03 km)
  let currentStop: string | null = null;
  let nextStop: string | null = null;
  let isStopped = false;

  if (upcomingStopsData.length > 0) {
    const closest = upcomingStopsData[0];
    if (!closest) {
  return {
    upcomingStops: [],
    currentStop: null,
    nextStop: null,
    isStopped: false,
  };
}
    if (closest.dist <= GEOFENCE_RADIUS_KM) {
      currentStop = closest.stop.name;
      isStopped = true;
      // If we are at the stop, the next stop is the one after it (if it exists)
      if (upcomingStopsData.length > 1) {
  const next = upcomingStopsData[1];

  if (next) {
    nextStop = next.stop.name;
  }
}
    } else {
      nextStop = closest.stop.name;
    }
  }

  // 4. Calculate ETA for all upcoming stops
  const effectiveSpeed = speed > 5 ? speed : 20; // fallback to 20 km/h if moving very slowly or stopped, just to give a theoretical ETA

  const upcomingStops: UpcomingStopPrediction[] = upcomingStopsData.map(item => {
    // Time = Distance / Speed
    const timeHours = item.dist / effectiveSpeed;
    const timeMinutes = Math.round(timeHours * 60);
    const timeSeconds = Math.round((timeHours * 3600) % 60);

    let etaString = "";
    
    // Format nicely
    if (item.dist <= GEOFENCE_RADIUS_KM) {
      etaString = "Arrived";
    } else if (timeMinutes === 0) {
      etaString = `${timeSeconds} sec`;
    } else if (timeMinutes < 60) {
      etaString = `${timeMinutes} min ${timeSeconds} sec`;
    } else {
      const hrs = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      etaString = `${hrs} hr ${mins} min`;
    }

    return {
      stopId: item.stop._id?.toString() || item.stop.name,
      name: item.stop.name,
      distanceKm: Number(item.dist.toFixed(2)),
      etaString,
    };
  });

  return {
    upcomingStops,
    currentStop,
    nextStop,
    isStopped,
  };
}
