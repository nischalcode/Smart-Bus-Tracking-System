import { Request, Response, NextFunction } from "express";
import TrackingModel from "./TrackingModel.js";
import RouteModel from "../routes/RouteModel.js";
import BusModel from "../buses/BusModel.js";
import { 
  calculateSpeed,
  calculateHaversineDistanceInMeters,
  calculateETA,
  updateGeofenceStatus,
} from "../../utils/haversine.js";

export class TrackingController {
  // ── POST /api/track ───────────────────────────────────────────────────────
  // Receives telemetry from mobile driver app every 10 seconds
  async receiveTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        driverId,
        driverName,
        busId,
        busNo,
        routeId,
        routeName,
        direction,
        latitude,
        longitude,
        accuracy,
        timestamp,
      } = req.body;

      if (!busId || latitude == null || longitude == null) {
        res.status(400).json({
          success: false,
          message: "Missing required tracking fields (busId, latitude, longitude)",
        });
        return;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        res.status(400).json({
          success: false,
          message: "Invalid coordinates: latitude must be -90..90, longitude must be -180..180",
        });
        return;
      }

      // Fetch previous tracking record for this bus to calculate speed via Haversine
      // Use $or to match both `bus` (ObjectId) and `busId` (string) fields
      const prevRecord = await TrackingModel.findOne({
        $or: [{ bus: busId }, { busId: busId }],
      }).sort({ createdAt: -1 });

      // Prevent reactivating a bus that was explicitly stopped
      if (prevRecord && (prevRecord.status === "Inactive" || prevRecord.status === "Stopped")) {
        res.status(200).json({
          success: false,
          message: "Tracking has been stopped for this bus. Re-initialize tracking to resume.",
        });
        return;
      }

      let calculatedSpeed = 0;
      const currentTimestamp = timestamp ? new Date(timestamp) : new Date();

      if (prevRecord) {
        calculatedSpeed = calculateSpeed(
          prevRecord.latitude,
          prevRecord.longitude,
          prevRecord.timestamp || prevRecord.createdAt,
          latitude,
          longitude,
          currentTimestamp,
          prevRecord.speed || 0
        );
      }

      // Fetch route to calculate geofence status and distance to next stop
      // Only populate stops that have valid coordinates
      const route = await RouteModel.findById(routeId).lean();
      let geofenceData: any = {
        currentStopIndex: -1,
        currentStopName: null,
        nextStopIndex: 0,
        nextStopName: null,
        previousStopIndex: -1,
        previousStopName: null,
        distanceToNextStop: null,
        etaToNextStop: null,
      };

      if (route && route.stops && route.stops.length > 0) {
        // Convert route stops to Haversine format, filtering only valid coordinates
        const stops = route.stops
          .filter((s: any) => typeof s.lat === "number" && typeof s.lng === "number")
          .map((s: any) => ({
            lat: s.lat,
            lng: s.lng,
            name: s.name,
          }));

        if (stops.length > 0) {
          // Calculate geofence status using stable state tracking
          const geofenceStatus = updateGeofenceStatus(
            latitude,
            longitude,
            stops,
            prevRecord?.currentStopIndex ?? -1,
            30 // 30 meters radius
          );

          // Get stop names
          const currentStop = geofenceStatus.currentStopIndex >= 0 ? stops[geofenceStatus.currentStopIndex] : null;
          const nextStop = geofenceStatus.nextStopIndex >= 0 ? stops[geofenceStatus.nextStopIndex] : null;
          const previousStop = geofenceStatus.previousStopIndex >= 0 ? stops[geofenceStatus.previousStopIndex] : null;

          // Calculate distance to next stop using Haversine
          let distanceToNextStop = null;
          let etaToNextStop = null;
          if (nextStop) {
            distanceToNextStop = calculateHaversineDistanceInMeters(
              latitude,
              longitude,
              nextStop.lat,
              nextStop.lng
            );
            etaToNextStop = calculateETA(distanceToNextStop / 1000, calculatedSpeed);
          }

          geofenceData = {
            currentStopIndex: geofenceStatus.currentStopIndex,
            currentStopName: currentStop?.name || null,
            nextStopIndex: geofenceStatus.nextStopIndex,
            nextStopName: nextStop?.name || null,
            previousStopIndex: geofenceStatus.previousStopIndex,
            previousStopName: previousStop?.name || null,
            distanceToNextStop,
            etaToNextStop,
          };
        }
      }

      // Single source of truth: upsert tracking record
      // Use $or to match both `bus` and `busId` fields for robustness
      const trackingRecord = await TrackingModel.findOneAndUpdate(
        { $or: [{ bus: busId }, { busId: busId }] },
        {
          $set: {
            driverId: driverId || "UNKNOWN",
            driverName: driverName || "Unknown Driver",
            busId: busId,
            busNo: busNo || "BUS-000",
            routeId: routeId || null,
            routeName: routeName || "Default Route",
            direction: direction || "Going",
            latitude: lat,
            longitude: lng,
            accuracy: Number(accuracy) || 0,
            speed: calculatedSpeed,
            timestamp: currentTimestamp,
            bus: busId,
            route: routeId,
            status: "Live",
            ...geofenceData,
          },
        },
        {
          new: true,
          upsert: true,
        }
      );

      // Also update Bus location field for consistency
      await BusModel.findByIdAndUpdate(busId, {
        location: {
          lat: lat,
          lng: lng,
          updatedAt: currentTimestamp,
        },
      });

      res.status(200).json({
        success: true,
        message: "Telemetry recorded successfully",
        speed: calculatedSpeed,
        tracking: trackingRecord,
      });
    } catch (error) {
      next(error);
    }
  }

  async initializeTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bus, route } = req.body;
      if (!bus || !route) {
        res.status(400).json({ success: false, message: "Bus and route are required to initialize tracking." });
        return;
      }

      const busDoc = await BusModel.findById(bus).populate("assignedDrivers");
      const routeDoc = await RouteModel.findById(route).populate("assignedBuses");

      if (!busDoc) {
        res.status(404).json({ success: false, message: "Bus not found." });
        return;
      }
      if (!routeDoc) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }

      if (busDoc.assignedRoute && busDoc.assignedRoute.toString() !== routeDoc._id.toString()) {
        res.status(400).json({ success: false, message: "Bus is already assigned to another route." });
        return;
      }

      if (!busDoc.assignedRoute) {
        busDoc.assignedRoute = routeDoc._id;
        busDoc.routeAssigned = true;
        busDoc.routeId = routeDoc._id.toString();
        busDoc.routeName = `${routeDoc.from} - ${routeDoc.to}`;
        await busDoc.save();
      }

      const defaultLat = busDoc.location?.lat ?? routeDoc.pathCoordinates?.[0]?.[0] ?? null;
      const defaultLng = busDoc.location?.lng ?? routeDoc.pathCoordinates?.[0]?.[1] ?? null;
      if (defaultLat == null || defaultLng == null) {
        res.status(400).json({ success: false, message: "No valid starting location. Assign the bus to a route with path coordinates first." });
        return;
      }
      const assignedDriver = Array.isArray(busDoc.assignedDrivers) ? busDoc.assignedDrivers[0] : undefined;
      const driverId = assignedDriver && typeof (assignedDriver as any)._id === "string" ? (assignedDriver as any)._id : "UNKNOWN";
      const driverName = assignedDriver && typeof (assignedDriver as any).name === "string" ? (assignedDriver as any).name : "Unknown Driver";
 
      const trackingRecord = await TrackingModel.findOneAndUpdate(
        { bus: busDoc._id },
        {
          driverId,
          driverName,
          busId: busDoc._id,
          busNo: busDoc.busNumber,
          routeId: routeDoc._id,
          routeName: `${routeDoc.from} - ${routeDoc.to}`,
          direction: "Outbound",
          latitude: Number(defaultLat),
          longitude: Number(defaultLng),
          accuracy: 0,
          speed: 0,
          timestamp: new Date(),
          bus: busDoc._id,
          route: routeDoc._id,
          status: "Live",
        },
        { new: true, upsert: true }
      );

      if (!routeDoc.assignedBuses?.some((id) => id.toString() === busDoc._id.toString())) {
        routeDoc.assignedBuses = [...(routeDoc.assignedBuses || []), busDoc._id as any];
      }
      await routeDoc.save();

      res.status(200).json({ success: true, tracking: trackingRecord });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/tracking/route/:routeId ──────────────────────────────────────
  // Route-based Live Tracking: Route -> Assigned Bus -> Latest Location
  async getLiveTrackingByRouteId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { routeId } = req.params;

      const route = await RouteModel.findById(routeId).populate("assignedBuses");
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found" });
        return;
      }

      const busIds = [
        ...(route.assignedBuses || []).map((bus) => (typeof bus === "string" ? bus : (bus as any)._id.toString())),
        ...(route.assignedBus ? [typeof route.assignedBus === "string" ? route.assignedBus : (route.assignedBus as any)._id.toString()] : []),
      ].filter(Boolean);

      // Find latest LIVE tracking entry for any of the assigned buses or matching routeId
      const latestTracking = await TrackingModel.findOne({
        status: "Live",
        $or: [
          { routeId: route._id },
          { route: route._id },
          { busId: { $in: busIds } },
          { bus: { $in: busIds } },
        ],
      } as any)
        .sort({ createdAt: -1 })
        .populate("bus")
        .populate("route");

      if (!latestTracking) {
        res.status(404).json({
          success: false,
          message: "No live tracking data available for buses on this route.",
          route,
        });
        return;
      }

      res.status(200).json({
        success: true,
        route,
        tracking: latestTracking,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/tracking/:busId ──────────────────────────────────────────────
  async getLiveTrackingByBusId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const tracking = await TrackingModel.findOne({
        status: "Live",
        $or: [{ bus: busId }, { busId: busId }],
      } as any)
        .sort({ createdAt: -1 })
        .populate("bus")
        .populate("route");

      if (!tracking) {
        res.status(404).json({ success: false, message: "No active tracking record found for this bus." });
        return;
      }
      res.status(200).json({ success: true, tracking });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/tracking ─────────────────────────────────────────────────────
  // Returns only LIVE tracking data (filters out Inactive buses)
  async getAllLiveTrackings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackings = await TrackingModel.aggregate([
        // Only include Live tracking records
        { $match: { status: "Live" } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$busId",
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
        // Populate bus and route references
        { 
          $lookup: {
            from: "buses",
            localField: "busId",
            foreignField: "_id",
            as: "bus",
          },
        },
        { $unwind: { path: "$bus", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "routes",
            localField: "routeId",
            foreignField: "_id",
            as: "route",
          },
        },
        { $unwind: { path: "$route", preserveNullAndEmptyArrays: true } },
      ]);

      res.status(200).json({ success: true, count: trackings.length, tracking: trackings });
    } catch (error) {
      next(error);
    }
  }

  // ── POST /api/tracking/stop/:busId ───────────────────────────────────────
  // Stop tracking for a specific bus (mark as Inactive + clear location)
  async stopTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;

      const tracking = await TrackingModel.findOneAndUpdate(
        { 
          $or: [{ bus: busId }, { busId: busId }],
        } as any,
        {
          $set: {
            status: "Inactive",
            speed: 0,
            latitude: 0,
            longitude: 0,
            currentStopIndex: -1,
            currentStopName: null,
            nextStopIndex: -1,
            nextStopName: null,
            previousStopIndex: -1,
            previousStopName: null,
            distanceToNextStop: null,
            etaToNextStop: null,
          },
        },
        { new: true }
      ).populate("bus").populate("route");

      if (!tracking) {
        res.status(404).json({ success: false, message: "Tracking record not found." });
        return;
      }

      // Also clear bus location in BusModel
      const trackingDoc = tracking as any;
      if (trackingDoc.bus) {
        const busIdToClear = trackingDoc.bus._id || busId;
        await BusModel.findByIdAndUpdate(busIdToClear, {
          $unset: { location: "" },
        });
      }

      res.status(200).json({
        success: true,
        message: "Tracking stopped successfully",
        tracking,
      });
    } catch (error) {
      next(error);
    }
  }

  // ── DELETE /api/tracking/:id ──────────────────────────────────────────────
  async deleteTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await TrackingModel.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Tracking record not found." });
        return;
      }
      res.status(200).json({ success: true, message: "Tracking deleted successfully." });
    } catch (error) {
      next(error);
    }
  }
}

export default TrackingController;
