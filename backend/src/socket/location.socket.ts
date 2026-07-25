import { Server, Socket } from "socket.io";
import { BusModel } from "../modules/buses/BusModel.js";
import TrackingModel from "../modules/tracking/TrackingModel.js";
import { enrichTrackingData } from "../utils/trackingLogic.js";
import { calculateSpeed } from "../utils/haversine.js";
import StopModel from "../modules/stops/StopModel.js";


export const registerLocationSocket = (
  io: Server,
  socket: Socket
) => {
  socket.on("driver:location:update", async (data) => {
    const { busId, lat, lng, speed: nativeSpeed } = data;

    // Get previous tracking to calculate speed
    const prevTracking = await TrackingModel.findOne({ bus: busId })
      .sort({ createdAt: -1 });

    const bus = await BusModel.findById(busId).populate("assignedRoute");

    let speed = nativeSpeed !== undefined ? Number(nativeSpeed) : 0;
    let enrichmentData = null;
    let currentDirection = prevTracking?.direction || "Going";

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

    const getObjId = (obj: any) => (obj && typeof obj === 'object' && obj._id ? obj._id : obj);
    const routeId = getObjId(bus?.assignedRoute) || getObjId(prevTracking?.route) || getObjId(prevTracking?.routeId);
    
    if (routeId) {
      // Fetch stops from StopModel because RouteModel stops might lack lat/lng coordinates!
      const stopDoc = await StopModel.findOne({ routeId: routeId });
      
      let validStops = stopDoc && stopDoc.stops && stopDoc.stops.length > 0 ? stopDoc.stops : [];
      
      // Fallback to route.stops if populated route exists (though it shouldn't be needed)
      if (validStops.length === 0 && typeof routeId === 'object' && (routeId as any).stops) {
          validStops = (routeId as any).stops;
      }

      if (validStops && validStops.length > 0) {
        enrichmentData = enrichTrackingData(
          lat,
          lng,
          speed,
          currentDirection,
          validStops
        );
      }
    }

    const updateObj: any = {
      latitude: lat,
      longitude: lng,
      speed,
      timestamp: new Date()
    };
    
    if (route) {
        updateObj.routeId = route._id;
        updateObj.route = route._id;
    }

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

    const currentTimestamp = new Date();
    
    // Save the enriched data to TrackingModel so it persists for GET /tracking polling
    await TrackingModel.findOneAndUpdate(
      { bus: busId },
      {
        busId: busId,
        latitude: lat,
        longitude: lng,
        speed: enrichmentData?.isStopped ? 0 : speed,
        timestamp: currentTimestamp,
        bus: busId,
        route: route?._id || bus?.assignedRoute,
        status: "Live",
        eta: enrichmentData?.upcomingStops[0]?.etaString || "N/A",
        nextStop: enrichmentData?.nextStop || "Terminal",
        currentStop: enrichmentData?.currentStop,
        isStopped: enrichmentData?.isStopped,
        upcomingStops: enrichmentData?.upcomingStops
      },
      { upsert: true, new: true }
    );

    await BusModel.findByIdAndUpdate(busId, {
      location: {
        lat,
        lng,
        updatedAt: currentTimestamp,
      },
    });

    io.emit("bus:location:updated", { 
      busId, 
      lat, 
      lng, 
      speed: enrichmentData?.isStopped ? 0 : speed,
      eta: enrichmentData?.upcomingStops[0]?.etaString || "N/A",
      nextStop: enrichmentData?.nextStop || "Terminal",
      currentStop: enrichmentData?.currentStop,
      isStopped: enrichmentData?.isStopped,
      upcomingStops: enrichmentData?.upcomingStops
    });
  });
};