import TrackingModel from "./TrackingModel.js";
import { getIO } from "../../socket/index.js";
import { enrichTrackingData } from "../../utils/trackingLogic.js";
import { calculateHaversineDistance } from "../../utils/haversine.js";

// ... rest of the file
export const startTrackingSimulation = (): void => {
  console.log("Initializing GPS Live Tracking Simulator...");

  setInterval(async () => {
    try {
      const trackingRecords = await TrackingModel.find({}).populate("route"); 

      const bulkOps: any[] = [];

      for (const track of trackingRecords) {
        const route = track.route as any;
        if (!route || !route.pathCoordinates || route.pathCoordinates.length === 0) {
          continue;
        }

        const path = route.pathCoordinates;
        let nextIndex = (track as any).currentIndex || 0;
        let direction = (track as any).direction || "Going";
        let lat = track.latitude;
        let lng = track.longitude;

        if (nextIndex >= path.length) {
          nextIndex = path.length - 1;
        }

        // Random speed between 20 and 45 km/h
        const speed = Math.floor(Math.random() * 25) + 20;
        
        // Calculate distance to move in 10 seconds (10/3600 hours)
        const distanceToMoveKm = (speed / 3600) * 10;
        let targetLat = path[nextIndex][0];
        let targetLng = path[nextIndex][1];

        let distToTarget = calculateHaversineDistance(lat, lng, targetLat, targetLng);

        // If we reached the target or are very close (less than 10 meters)
        if (distToTarget <= 0.01) {
          if (direction === "Going") {
            nextIndex++;
            if (nextIndex >= path.length) {
              direction = "Coming";
              nextIndex = path.length - 2;
              if (nextIndex < 0) nextIndex = 0;
            }
          } else {
            nextIndex--;
            if (nextIndex < 0) {
              direction = "Going";
              nextIndex = 1;
              if (nextIndex >= path.length) nextIndex = 0;
            }
          }
          // Update target to the next one
          targetLat = path[nextIndex][0];
          targetLng = path[nextIndex][1];
          distToTarget = calculateHaversineDistance(lat, lng, targetLat, targetLng);
        }

        // Interpolate position
        if (distToTarget > 0.001) {
          // Linear interpolation for small distances
          const ratio = Math.min(1, distanceToMoveKm / distToTarget);
          lat = lat + (targetLat - lat) * ratio;
          lng = lng + (targetLng - lng) * ratio;
        } else {
          lat = targetLat;
          lng = targetLng;
        }

        // Use the new trackingLogic to calculate ETAs, stops, and geofencing
        const enrichment = enrichTrackingData(
          lat, 
          lng, 
          speed, 
          direction, 
          route.stops || []
        );

        bulkOps.push({
          updateOne: {
            filter: { _id: track._id },
            update: {
              latitude: lat,
              longitude: lng,
              speed: enrichment.isStopped ? 0 : speed,
              direction: direction,
              currentIndex: nextIndex,
              eta: enrichment.upcomingStops[0]?.etaString || "N/A",
              nextStop: enrichment.nextStop || "Terminal",
              currentStop: enrichment.currentStop,
              isStopped: enrichment.isStopped,
              upcomingStops: enrichment.upcomingStops
            },
          },
        });
      }

      if (bulkOps.length > 0) {
        await TrackingModel.bulkWrite(bulkOps);

          const updatedTracking = await TrackingModel.find({})
            .populate("bus")
            .populate("route");

          // Emit live updates to all connected clients
          const io = getIO();
          io.emit("tracking-update", updatedTracking);
      }
    } catch (error: any) {
      console.error("GPS Simulator Loop Error:", error.message);
    }
  }, 10000);
};