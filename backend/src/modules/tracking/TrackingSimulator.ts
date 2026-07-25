import TrackingModel from "./TrackingModel.js";
import { getIO } from "../../socket/index.js";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const denseRouteCache = new Map<string, [number, number][]>();
const MAX_CACHE_SIZE = 50;

// Target: full route in ~10 minutes at 10-second ticks = 60 ticks
const TICKS_PER_ROUTE = 60;

function cacheRoute(key: string, value: [number, number][]): void {
  if (denseRouteCache.size >= MAX_CACHE_SIZE) {
    const firstKey = denseRouteCache.keys().next().value;
    if (firstKey) denseRouteCache.delete(firstKey);
  }
  denseRouteCache.set(key, value);
}

async function fetchRoute(waypoints: [number, number][]): Promise<[number, number][] | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map((c) => `${c[1]},${c[0]}`).join(";");
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const route = data.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    return route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
  } catch {
    return null;
  }
}

/**
 * Convert a route fraction (0–1) into [lat, lng] on the given path.
 * Finds which segment the fraction falls into and linearly interpolates.
 */
function positionFromFraction(
  path: [number, number][],
  fraction: number
): [number, number] {
  if (path.length === 0) return [0, 0];
  if (path.length === 1) return path[0]!;
  if (fraction <= 0) return path[0]!;
  if (fraction >= 1) return path[path.length - 1]!;

  const scaledIndex = fraction * (path.length - 1);
  const lo = Math.floor(scaledIndex);
  const hi = Math.min(lo + 1, path.length - 1);
  const t = scaledIndex - lo;
  const loCoord = path[lo]!;
  const hiCoord = path[hi]!;

  return [
    loCoord[0] + t * (hiCoord[0] - loCoord[0]),
    loCoord[1] + t * (hiCoord[1] - loCoord[1]),
  ];
}

export const startTrackingSimulation = (): void => {
  console.log("Initializing GPS Live Tracking Simulator...");

  setInterval(async () => {
    try {
      const trackingRecords = await TrackingModel.find({
        status: "Live",
      }).populate("route");

      const bulkOps: any[] = [];

      for (const track of trackingRecords) {
        const route = track.route as any;
        if (!route || !route.pathCoordinates || route.pathCoordinates.length === 0) {
          continue;
        }

        // Skip records updated recently by real telemetry (within last 30 seconds)
        const lastUpdate = (track as any).updatedAt || track.timestamp;
        if (lastUpdate) {
          const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
          if (timeSinceUpdate < 30000) continue;
        }

        const routeIdStr = route._id.toString();
        let path = denseRouteCache.get(routeIdStr);

        if (!path) {
           const fetchedPath = await fetchRoute(route.pathCoordinates);
           if (fetchedPath) {
               cacheRoute(routeIdStr, fetchedPath);
              path = fetchedPath;
           } else {
              path = route.pathCoordinates;
           }
        }

        if (!path || path.length === 0) continue;

        // Convert stored currentIndex (which may be from a different path density)
        // into a route fraction (0–1) using the original sparse pathCoordinates.
        const sparsePath = route.pathCoordinates;
        const storedIndex = (track as any).currentIndex || 0;
        const fraction = sparsePath.length > 1
          ? Math.min(storedIndex / (sparsePath.length - 1), 1)
          : 0;

        if ((track as any).status === "Completed" && fraction >= 1) {
          continue;
        }

        // Proportional step: advance by 1/TICKS_PER_ROUTE of the total journey each tick
        const fractionStep = 1 / TICKS_PER_ROUTE;
        const nextFraction = Math.min(fraction + fractionStep, 1);

        // Find the position on the current (possibly dense) path
        const [lat, lng] = positionFromFraction(path, nextFraction);

        // Convert fraction back to a dense-path index for storage
        const nextIndex = Math.round(nextFraction * (path.length - 1));

        let speed = Math.floor(Math.random() * 25) + 20;
        let status = "Live";

        if (nextFraction >= 1) {
          speed = 0;
          status = "Completed";
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: track._id },
            update: {
              $set: {
                latitude: lat,
                longitude: lng,
                speed,
                status,
                currentIndex: nextIndex,
              },
            },
          },
        });
      }

      if (bulkOps.length > 0) {
        await TrackingModel.bulkWrite(bulkOps);

        const updatedTracking = await TrackingModel.find({ status: "Live" } as any)
          .populate("bus")
          .populate("route");

        const io = getIO();
        if (io) {
          io.emit("tracking-update", updatedTracking);
        }
      }
    } catch (error: any) {
      console.error("GPS Simulator Loop Error:", error.message);
    }
  }, 10000);
};
