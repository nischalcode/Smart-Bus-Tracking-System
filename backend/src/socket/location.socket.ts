import { Server, Socket } from "socket.io";
import TrackingModel from "../modules/tracking/TrackingModel.js";
import {
  processTrackingFromLocation,
  updateTrackingDocument,
} from "../modules/tracking/TrackingService.js";
import { BusModel } from "../modules/buses/BusModel.js";
import type { Coord } from "../utils/geo.js";

function isValidLocation(data: unknown): data is { busId: string; lat: number; lng: number } {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.busId === "string" &&
    d.busId.length > 0 &&
    typeof d.lat === "number" &&
    !Number.isNaN(d.lat) &&
    typeof d.lng === "number" &&
    !Number.isNaN(d.lng)
  );
}

export const registerLocationSocket = (io: Server, socket: Socket) => {
  socket.on("driver:location:update", async (data) => {
    if (!isValidLocation(data)) {
      socket.emit("driver:location:error", { message: "Invalid location payload." });
      return;
    }

    const { busId, lat, lng } = data;
    const now = new Date();

    try {
      await BusModel.findByIdAndUpdate(busId, {
        "location.lat": lat,
        "location.lng": lng,
        "location.updatedAt": now,
      });

      const tracking = await TrackingModel.findOne({ bus: busId }).populate("route").populate("bus", "-password");
      if (!tracking) {
        io.emit("bus:location:updated", { busId, lat, lng, updatedAt: now });
        return;
      }

      const update = await processTrackingFromLocation(tracking, [lat, lng] as Coord, now);
      if (!update) {
        socket.emit("driver:location:error", { message: "Route data unavailable for ETA calculation." });
        return;
      }

      const updated = await updateTrackingDocument(tracking._id.toString(), update);
      if (!updated) {
        socket.emit("driver:location:error", { message: "Failed to update tracking record." });
        return;
      }

      const populatedBus = tracking.bus as any;
      const populatedRoute = tracking.route as any;
      const payload = {
        _id: updated._id.toString(),
        bus: populatedBus
          ? {
              _id: populatedBus._id.toString(),
              busNumber: populatedBus.busNumber,
              status: populatedBus.status,
            }
          : updated.bus,
        route: populatedRoute
          ? {
              _id: populatedRoute._id.toString(),
              routeNo: populatedRoute.routeNo,
              from: populatedRoute.from,
              to: populatedRoute.to,
              pathCoordinates: populatedRoute.pathCoordinates,
              stops: populatedRoute.stops,
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

      io.emit("bus:location:updated", payload);
    } catch (error: any) {
      console.error("Socket location update error:", error.message);
      socket.emit("driver:location:error", { message: "Server error while processing location." });
    }
  });
};
