import { Request, Response, NextFunction } from "express";
import TrackingModel from "./TrackingModel.js";
import RouteModel from "../routes/RouteModel.js";
import BusModel from "../buses/BusModel.js";
import { calculateSpeed } from "../../utils/haversine.js";
import { enrichTrackingData } from "../../utils/trackingLogic.js";
import StopModel from "../stops/StopModel.js";

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

      if (!busId || !latitude || !longitude) {
        res.status(400).json({
          success: false,
          message: "Missing required tracking fields (busId, latitude, longitude)",
        });
        return;
      }

      // Fetch previous tracking record for this bus to calculate speed via Haversine
      const prevRecord = await TrackingModel.findOne({
        $or: [{ busId }, { busNo }, { bus: busId }],
      }).sort({ createdAt: -1 });

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
      
      const getObjId = (obj: any) => (obj && typeof obj === 'object' && obj._id ? obj._id : obj);
      const safeRouteId = getObjId(routeId) || getObjId(prevRecord?.routeId);
      
      // Fetch the route to get stops for ETA calculation
      const route = await RouteModel.findById(safeRouteId);
      let stops = route ? route.stops : [];
      
      if (route) {
        const stopDoc = await StopModel.findOne({ routeId: route._id });
        if (stopDoc && stopDoc.stops && stopDoc.stops.length > 0) {
          stops = stopDoc.stops;
        }
      }
      
      const currentDirection = direction || prevRecord?.direction || "Going";

      // Enrich tracking data with direction, stops, ETA and geofencing
      const enrichment = enrichTrackingData(
        Number(latitude),
        Number(longitude),
        calculatedSpeed,
        currentDirection,
        stops as any
      );

      // Create tracking record
      // Update existing tracking or create if not exists
    const trackingRecord = await TrackingModel.findOneAndUpdate(
      { bus: busId },
      {
        driverId: driverId || "UNKNOWN",
        driverName: driverName || "Unknown Driver",
        busId: busId,
        busNo: busNo || "BUS-000",
        routeId: routeId || busId,
        routeName: routeName || "Default Route",
        direction: currentDirection,
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: Number(accuracy) || 0,
        speed: enrichment.isStopped ? 0 : calculatedSpeed,
        timestamp: currentTimestamp,
        bus: busId,
        route: routeId,
        status: "Live",
        eta: enrichment.upcomingStops[0]?.etaString || "N/A",
        nextStop: enrichment.nextStop || "Terminal",
        currentStop: enrichment.currentStop,
        isStopped: enrichment.isStopped,
        upcomingStops: enrichment.upcomingStops
      },
      {
        new: true,
        upsert: true,
      }
    );
      // Also update Bus location field
      await BusModel.findByIdAndUpdate(busId, {
        location: {
          lat: Number(latitude),
          lng: Number(longitude),
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

      const defaultLat = busDoc.location?.lat ?? routeDoc.pathCoordinates?.[0]?.[0] ?? 0;
      const defaultLng = busDoc.location?.lng ?? routeDoc.pathCoordinates?.[0]?.[1] ?? 0;
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

      // Find latest tracking entry for any of the assigned buses or matching routeId
      const latestTracking = await TrackingModel.findOne({
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
        $or: [{ busId }, { bus: busId }],
      } as any)
        .sort({ createdAt: -1 })
        .populate("bus")
        .populate("route");

      if (!tracking) {
        res.status(404).json({ success: false, message: "Tracking record not found." });
        return;
      }
      res.status(200).json({ success: true, tracking });
    } catch (error) {
      next(error);
    }
  }

  // ── GET /api/tracking ─────────────────────────────────────────────────────
  async getAllLiveTrackings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const trackings = await TrackingModel.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$busId",
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
      ]);

      await TrackingModel.populate(trackings, { path: "bus" });
      await TrackingModel.populate(trackings, { path: "route" });

      const exactTrackings = trackings.map(t => {
        const bus = t.bus as any;
        if (bus && bus.location && bus.location.lat && bus.location.lng) {
          return {
            ...t,
            latitude: bus.location.lat,
            longitude: bus.location.lng
          };
        }
        return t;
      });

      res.status(200).json({ success: true, count: exactTrackings.length, tracking: exactTrackings });
    } catch (error) {
      next(error);
    }
  }
}

export default TrackingController;
