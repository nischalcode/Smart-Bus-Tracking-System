import { Request, Response, NextFunction } from "express";
import TrackingModel from "./TrackingModel.js";
import RouteModel from "../routes/RouteModel.js";
import BusModel from "../buses/BusModel.js";
import StopModel from "../stops/StopModel.js";
import { calculateSpeed, calculateHaversineDistance } from "../../utils/haversine.js";
import { getIO } from "../../socket/index.js";
import { eventDetectionService } from "../notifications/EventDetectionService.js";
import { notificationEventConfig } from "../notifications/NotificationEventConfig.js";

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

      // Fetch Bus Document to ensure we have route & status info
      const busDoc = await BusModel.findById(busId).populate("assignedRoute");
      
      // Determine effective route ID & Route Name
      let effectiveRouteId = routeId;
      let effectiveRouteName = routeName;

      // ── CHANGED: Normalize direction to only "Going" or "Coming" ──
      const effectiveDirection = direction === "Coming" ? "Coming" : "Going";

      if (!effectiveRouteId || effectiveRouteId === "null" || effectiveRouteId === "Unassigned") {
        if (busDoc && busDoc.assignedRoute) {
          const assignedRouteObj = busDoc.assignedRoute as any;
          effectiveRouteId = assignedRouteObj._id ? assignedRouteObj._id.toString() : busDoc.assignedRoute.toString();
          // ── CHANGED: Always derive routeName from canonical from/to, never direction-dependent ──
          effectiveRouteName = assignedRouteObj.from && assignedRouteObj.to 
            ? `${assignedRouteObj.from} - ${assignedRouteObj.to}` 
            : busDoc.routeName || "Assigned Route";
        }
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
          Number(latitude),
          Number(longitude),
          currentTimestamp,
          prevRecord.speed || 0
        );
      }

      // ── Geofencing & ETA calculations ──
      let currentStop = prevRecord?.currentStop || "N/A";
      let atStop = false;
      let nextStop = prevRecord?.nextStop || "N/A";
      let distanceToNextStop = 0;
      let remainingDistance = 0;
      let eta = "N/A";
      let stopETAs: any[] = [];

      if (effectiveRouteId) {
        // 1. First attempt: Get stops from RouteModel directly
        let stops: Array<{ name: string; lat: number; lng: number }> = [];
        const routeDoc = await RouteModel.findById(effectiveRouteId);

        // ── CHANGED: Always build routeName from canonical route from/to fields ──
        // This ensures routeName stays constant regardless of direction
        if (routeDoc && routeDoc.from && routeDoc.to) {
          effectiveRouteName = `${routeDoc.from} - ${routeDoc.to}`;
        }
        
        if (routeDoc && routeDoc.stops && routeDoc.stops.length > 0) {
          stops = routeDoc.stops
            .filter((s: any) => s && s.name && typeof s.lat === "number" && typeof s.lng === "number")
            .map((s: any) => ({ name: String(s.name), lat: Number(s.lat), lng: Number(s.lng) }));
        }

        // 2. Fallback attempt: Get stops from StopModel if RouteModel stops are empty
        if (stops.length === 0) {
          const routeStopsDoc = await StopModel.findOne({ routeId: effectiveRouteId });
          if (routeStopsDoc && routeStopsDoc.stops && routeStopsDoc.stops.length > 0) {
            stops = routeStopsDoc.stops
              .filter((s: any) => s && s.name && typeof s.lat === "number" && typeof s.lng === "number")
              .map((s: any) => ({ name: String(s.name), lat: Number(s.lat), lng: Number(s.lng) }));
          }
        }

        // Process stops if available
        if (stops.length > 0) {
          // ── Respect direction: Going vs Coming ──
          if (effectiveDirection === "Coming") {
            stops.reverse();
          }

          // Configurable stop-distance arrival threshold in kilometers (0.04 km = 40 meters)
          const STOP_ARRIVAL_THRESHOLD_KM = notificationEventConfig.arrivalDistanceKm;

          // 1. Calculate distance from live GPS to every stop to find overall nearest stop
          let nearestIdx = 0;
          let shortestDistToStop = Number.MAX_VALUE;

          for (let i = 0; i < stops.length; i++) {
            const dist = calculateHaversineDistance(
              Number(latitude),
              Number(longitude),
              stops[i]!.lat,
              stops[i]!.lng
            );
            if (dist < shortestDistToStop) {
              shortestDistToStop = dist;
              nearestIdx = i;
            }
          }

          let matchedCurrentStop = "Not at any stop";
          let matchedNextStop = "";
          let targetIndex = 0;
          let distanceToTarget = 0;

          // 2. Check if within threshold of any stop for Current Stop assignment
          let insideThresholdIdx = -1;
          for (let i = 0; i < stops.length; i++) {
            const dist = calculateHaversineDistance(
              Number(latitude),
              Number(longitude),
              stops[i]!.lat,
              stops[i]!.lng
            );
            if (dist <= STOP_ARRIVAL_THRESHOLD_KM) {
              insideThresholdIdx = i;
              break;
            }
          }

          if (insideThresholdIdx !== -1) {
            // Bus is physically at a stop within 30-50m threshold
            matchedCurrentStop = stops[insideThresholdIdx]!.name;
            atStop = true;

            if (insideThresholdIdx === stops.length - 1) {
              matchedNextStop = "Route End";
              targetIndex = insideThresholdIdx;
              distanceToTarget = 0;
            } else {
              targetIndex = insideThresholdIdx + 1;
              matchedNextStop = stops[targetIndex]!.name;
              distanceToTarget = calculateHaversineDistance(
                Number(latitude),
                Number(longitude),
                stops[targetIndex]!.lat,
                stops[targetIndex]!.lng
              );
            }
          } else {
            // Bus is farther than threshold ("Not at any stop")
            atStop = false;
            matchedCurrentStop = "Not at any stop";

            // Determine route progression relative to stops
            const firstStopDist = calculateHaversineDistance(
              Number(latitude),
              Number(longitude),
              stops[0]!.lat,
              stops[0]!.lng
            );
            const lastStopDist = calculateHaversineDistance(
              Number(latitude),
              Number(longitude),
              stops[stops.length - 1]!.lat,
              stops[stops.length - 1]!.lng
            );

            // 3. Before first stop
            if (nearestIdx === 0 && firstStopDist > STOP_ARRIVAL_THRESHOLD_KM) {
              matchedNextStop = stops[0]!.name;
              targetIndex = 0;
              distanceToTarget = firstStopDist;
            } 
            // 4. Past final stop
            else if (nearestIdx === stops.length - 1 && lastStopDist > STOP_ARRIVAL_THRESHOLD_KM) {
              matchedNextStop = "Route End";
              targetIndex = stops.length - 1;
              distanceToTarget = 0;
            } 
            // 5. Between stops along route
            else {
              // Project onto route segments to find current segment position
              let bestSegmentIdx = 0;
              let minProjectionDist = Number.MAX_VALUE;

              for (let i = 0; i < stops.length - 1; i++) {
                const s1 = stops[i]!;
                const s2 = stops[i + 1]!;

                const dx = s2.lat - s1.lat;
                const dy = s2.lng - s1.lng;
                const lenSq = dx * dx + dy * dy;

                let t = 0;
                if (lenSq > 0) {
                  t = ((Number(latitude) - s1.lat) * dx + (Number(longitude) - s1.lng) * dy) / lenSq;
                  t = Math.max(0, Math.min(1, t));
                }

                const projLat = s1.lat + t * dx;
                const projLng = s1.lng + t * dy;

                const distToSegment = calculateHaversineDistance(
                  Number(latitude),
                  Number(longitude),
                  projLat,
                  projLng
                );

                if (distToSegment < minProjectionDist) {
                  minProjectionDist = distToSegment;
                  bestSegmentIdx = i;
                }
              }

              targetIndex = bestSegmentIdx + 1;
              matchedNextStop = stops[targetIndex]!.name;
              distanceToTarget = calculateHaversineDistance(
                Number(latitude),
                Number(longitude),
                stops[targetIndex]!.lat,
                stops[targetIndex]!.lng
              );
            }
          }

          currentStop = matchedCurrentStop;
          nextStop = matchedNextStop;
          distanceToNextStop = distanceToTarget;

          if (matchedNextStop === "Route End") {
            remainingDistance = 0;
            eta = "Arrived";
          } else {
            let remainingDistTotal = distanceToTarget;
            for (let i = targetIndex; i < stops.length - 1; i++) {
              remainingDistTotal += calculateHaversineDistance(
                stops[i]!.lat,
                stops[i]!.lng,
                stops[i + 1]!.lat,
                stops[i + 1]!.lng
              );
            }
            remainingDistance = remainingDistTotal;

            const speedToUse = calculatedSpeed > 0 ? calculatedSpeed : 20;
            eta = `${Math.ceil((remainingDistance / speedToUse) * 60)} min`;

            let accumDist = distanceToTarget;
            for (let i = targetIndex; i < stops.length; i++) {
              const stop = stops[i]!;
              if (i > targetIndex) {
                accumDist += calculateHaversineDistance(
                  stops[i - 1]!.lat,
                  stops[i - 1]!.lng,
                  stop.lat,
                  stop.lng
                );
              }
              stopETAs.push({
                name: stop.name,
                distance: accumDist,
                eta: `${Math.ceil((accumDist / speedToUse) * 60)} min`,
              });
            }
          }
        }
      }

      // Update existing tracking or create if not exists
      const trackingRecord = await TrackingModel.findOneAndUpdate(
        { bus: busId },
        {
          driverId: driverId || "UNKNOWN",
          driverName: driverName || "Unknown Driver",
          busId: busId,
          busNo: busNo || busDoc?.busNumber || "BUS-000",
          routeId: effectiveRouteId || busId,
          routeName: effectiveRouteName || "Default Route",
          // ── CHANGED: Use normalized direction, separate from route name ──
          direction: effectiveDirection,
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracy: Number(accuracy) || 0,
          speed: calculatedSpeed,
          timestamp: currentTimestamp,
          bus: busId,
          route: effectiveRouteId || undefined,
          status: "Live",
          atStop,
          currentStop,
          nextStop,
          distanceToNextStop,
          remainingDistance,
          eta,
          stopETAs,
        },
        {
          new: true,
          upsert: true,
        }
      );

      // Update Bus location field
      await BusModel.findByIdAndUpdate(busId, {
        location: {
          lat: Number(latitude),
          lng: Number(longitude),
          updatedAt: currentTimestamp,
        },
      });

      // Event detection observes the persisted telemetry and does not alter it.
      await eventDetectionService.telemetryReceived(trackingRecord, busDoc);

      // Broadcast tracking update to connected socket clients
      try {
        const io = getIO();
        if (io) {
          io.emit("tracking-update", [trackingRecord]);
        }
      } catch (err) {
        // Socket broadcast optional fallback
      }

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
          // ── CHANGED: Use valid direction enum value instead of "Outbound" ──
          direction: "Going",
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

      const trackings = await TrackingModel.find({
        $or: [
          { routeId: route._id },
          { route: route._id },
          { busId: { $in: busIds } },
          { bus: { $in: busIds } },
        ],
      } as any)
        .sort({ createdAt: -1 })
        .populate("bus")
        .populate("route")
        .limit(10);

      const activeTracking = trackings.find(t => t.bus && (t.bus as any).status !== "Inactive");

      if (!activeTracking) {
        res.status(404).json({
          success: false,
          message: "No active live tracking data available for buses on this route.",
          route,
        });
        return;
      }

      res.status(200).json({
        success: true,
        route,
        tracking: activeTracking,
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
      const aggregateTrackings = await TrackingModel.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { $ifNull: ["$bus", "$busId"] },
            doc: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$doc" } },
      ]);

      const populatedTrackings = await TrackingModel.populate(aggregateTrackings, { path: "bus route" });
      const activeTrackings = populatedTrackings.filter(t => t.bus && (t.bus as any).status !== "Inactive");

      res.status(200).json({ success: true, count: activeTrackings.length, tracking: activeTrackings });
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
