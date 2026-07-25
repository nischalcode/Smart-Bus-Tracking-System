import { Server, Socket } from "socket.io";
import { BusModel } from "../modules/buses/BusModel.js";
import TrackingModel from "../modules/tracking/TrackingModel.js";
import { enrichTrackingData } from "../utils/trackingLogic.js";
import { calculateSpeed } from "../utils/haversine.js";
import StopModel from "../modules/stops/StopModel.js";

export const registerLocationSocket = (io: Server, socket: Socket) => {
  socket.on("driver:location:update", async (data) => {
    try {
      const { busId, lat, lng, speed: nativeSpeed, direction: nativeDirection } = data;

      if (!busId || lat === undefined || lng === undefined) return;

      // 1. Get previous tracking record
      const prevTracking = await TrackingModel.findOne({ bus: busId }).sort({ createdAt: -1 });

      // 2. Get bus with its assigned route
      const bus = await BusModel.findById(busId).populate("assignedRoute");

      // 3. Calculate speed
      let speed = nativeSpeed !== undefined ? Number(nativeSpeed) : 0;
      if (prevTracking && nativeSpeed === undefined) {
        speed = calculateSpeed(
          prevTracking.latitude,
          prevTracking.longitude,
          prevTracking.timestamp || new Date(),
          lat,
          lng,
          new Date(),
          prevTracking.speed || 0
        );
      }

      // 4. Determine direction
      const currentDirection = nativeDirection || prevTracking?.direction || "Going";

      // 5. Safely extract routeId (handles both ObjectId and populated objects)
      const extractId = (val: any) =>
        val && typeof val === "object" && val._id ? val._id.toString() : val?.toString?.() || null;

      const routeId =
        extractId(bus?.assignedRoute) ||
        extractId(prevTracking?.route) ||
        extractId(prevTracking?.routeId);

      // 6. Fetch stops from StopModel (guaranteed to have valid lat/lng)
      let enrichmentData = null;
      if (routeId) {
        const stopDoc = await StopModel.findOne({ routeId });
        const validStops = stopDoc?.stops?.length ? stopDoc.stops : [];

        if (validStops.length > 0) {
          enrichmentData = enrichTrackingData(lat, lng, speed, currentDirection, validStops as any);
        }
      }

      // 7. Build update payload
      const now = new Date();
      const updatePayload: any = {
        busId,
        bus: busId,
        latitude: lat,
        longitude: lng,
        speed: enrichmentData?.isStopped ? 0 : speed,
        direction: currentDirection,
        timestamp: now,
        status: "Live",
      };

      if (routeId) {
        updatePayload.routeId = routeId;
        updatePayload.route = routeId;
      }

      if (enrichmentData) {
        updatePayload.eta = enrichmentData.upcomingStops[0]?.etaString || "N/A";
        updatePayload.nextStop = enrichmentData.nextStop || "Terminal";
        updatePayload.currentStop = enrichmentData.currentStop;
        updatePayload.isStopped = enrichmentData.isStopped;
        updatePayload.upcomingStops = enrichmentData.upcomingStops;
      }

      // 8. Save to TrackingModel (single update, no duplicates)
      await TrackingModel.findOneAndUpdate({ bus: busId }, updatePayload, {
        upsert: true,
        new: true,
      });

      // 9. Update BusModel location field
      await BusModel.findByIdAndUpdate(busId, {
        location: { lat, lng, updatedAt: now },
      });

      // 10. Broadcast to all frontend clients
      io.emit("bus:location:updated", {
        busId,
        lat,
        lng,
        speed: updatePayload.speed,
        direction: currentDirection,
        eta: updatePayload.eta,
        nextStop: updatePayload.nextStop,
        currentStop: updatePayload.currentStop,
        isStopped: updatePayload.isStopped,
        upcomingStops: updatePayload.upcomingStops,
      });
    } catch (err) {
      console.error("[location.socket] Error processing driver update:", err);
    }
  });
};