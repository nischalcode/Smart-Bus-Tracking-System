import TrackingModel from "./TrackingModel.js";
import { getIO } from "../../socket/index.js";
import { processTrackingSimulationStep, updateTrackingDocument } from "./TrackingService.js";
import type { Coord } from "../../utils/geo.js";

export const startTrackingSimulation = (): void => {
  console.log("Initializing GPS Live Tracking Simulator...");

  const io = getIO();

  setInterval(async () => {
    try {
      const trackingRecords = await TrackingModel.find({}).populate("route").populate("bus", "-password");

      for (const track of trackingRecords) {
        const populatedRoute = track.route as any;
        const populatedBus = track.bus as any;
        if (!populatedRoute || !Array.isArray(populatedRoute.pathCoordinates) || populatedRoute.pathCoordinates.length < 2) {
          continue;
        }

        const routePath = populatedRoute.pathCoordinates as unknown as Coord[];
        const update = processTrackingSimulationStep(track, routePath);
        if (!update) continue;

        const updated = await updateTrackingDocument(track._id.toString(), update);
        if (!updated) continue;

        const payload = buildSocketPayload(updated, populatedBus, populatedRoute);
        io.emit("bus:location:updated", payload);
      }
    } catch (error: any) {
      console.error("GPS Simulator Loop Error:", error.message);
    }
  }, 10_000);
};

function buildSocketPayload(updated: any, bus: any, route: any) {
  return {
    _id: updated._id.toString(),
    bus: bus
      ? {
          _id: bus._id.toString(),
          busNumber: bus.busNumber,
          status: bus.status,
        }
      : updated.bus,
    route: route
      ? {
          _id: route._id.toString(),
          routeNo: route.routeNo,
          from: route.from,
          to: route.to,
          pathCoordinates: route.pathCoordinates,
          stops: route.stops,
        }
      : updated.route,
    latitude: updated.latitude,
    longitude: updated.longitude,
    speed: updated.speed,
    heading: updated.heading,
    nextStop: updated.nextStop,
    nextStopEtaSeconds: updated.nextStopEtaSeconds,
    eta: updated.eta,
    status: updated.status,
    currentIndex: updated.currentIndex,
    updatedAt: updated.updatedAt,
  };
}
