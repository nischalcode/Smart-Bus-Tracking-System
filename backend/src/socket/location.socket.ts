import { Server, Socket } from "socket.io";
import { BusModel } from "../modules/buses/BusModel.js";
import TrackingModel from "../modules/tracking/TrackingModel.js";
import { enrichTrackingData } from "../utils/trackingLogic.js";
import { calculateSpeed } from "../utils/haversine.js";


export const registerLocationSocket = (
  io: Server,
  socket: Socket
) => {
  socket.on("driver:location:update", async (data) => {
    const { busId, lat, lng } = data;

    // Get previous tracking to calculate speed
    const prevTracking = await TrackingModel.findOne({ bus: busId }).sort({ createdAt: -1 }).populate("route");

    let speed = 0;
    let enrichmentData = null;

    if (prevTracking) {
      speed = calculateSpeed(
        prevTracking.latitude,
        prevTracking.longitude,
        prevTracking.timestamp || new Date(),
        lat,
        lng,
        new Date(),
        prevTracking.speed || 0
      );

      const route = prevTracking.route as any;
      if (route && route.stops) {
        enrichmentData = enrichTrackingData(
          lat,
          lng,
          speed,
          prevTracking.direction || "Going",
          route.stops
        );
      }
    }

    const updateObj: any = {
      latitude: lat,
      longitude: lng,
      speed,
      timestamp: new Date()
    };

    if (enrichmentData) {
      updateObj.eta = enrichmentData.upcomingStops[0]?.etaString || "N/A";
      updateObj.nextStop = enrichmentData.nextStop || "Terminal";
      updateObj.currentStop = enrichmentData.currentStop;
      updateObj.isStopped = enrichmentData.isStopped;
      updateObj.upcomingStops = enrichmentData.upcomingStops;
      
      if (enrichmentData.isStopped) {
        updateObj.speed = 0;
      }
    }

    // Update TrackingModel
    await TrackingModel.findOneAndUpdate(
      { bus: busId },
      updateObj,
      { new: true, upsert: true }
    );

    await BusModel.findByIdAndUpdate(busId, {
      location: {
        lat,
        lng,
        updatedAt: new Date(),
      },
    });

    io.emit("bus:location:updated", { 
      busId, 
      lat, 
      lng, 
      speed: updateObj.speed,
      eta: updateObj.eta,
      nextStop: updateObj.nextStop,
      currentStop: updateObj.currentStop,
      isStopped: updateObj.isStopped,
      upcomingStops: updateObj.upcomingStops
    });
  });
};