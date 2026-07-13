import { Request, Response, NextFunction } from "express";
import TrackingModel from "./TrackingModel.js";
import RouteModel from "../routes/RouteModel.js";

export class TrackingController {
  async getAllLiveTrackings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const [tracking, total] = await Promise.all([
        TrackingModel.find({}).populate("bus").populate("route").skip(skip).limit(limit),
        TrackingModel.countDocuments({}),
      ]);
      res.status(200).json({ success: true, tracking, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }

  async getLiveTrackingByBusId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busId } = req.params;
      const tracking = await TrackingModel.findOne({ bus: busId } as any)
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

  async initializeTracking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bus, route } = req.body;

      const routeData = await RouteModel.findById(route);
      if (!routeData || !routeData.pathCoordinates || routeData.pathCoordinates.length === 0) {
        res.status(400).json({ success: false, message: "Route not found or has no coordinates." });
        return;
      }

      const startingCoords = routeData.pathCoordinates[0] as unknown as [number, number];
      if (!startingCoords) {
        res.status(400).json({ success: false, message: "No starting coordinates available on this route." });
        return;
      }

      await TrackingModel.deleteOne({ bus: bus as any });

      const newTracking = await TrackingModel.create({
        bus,
        route,
        latitude: startingCoords[0],
        longitude: startingCoords[1],
        currentIndex: 0,
        speed: 0,
        eta: "Starting soon",
        nextStop: routeData.stops[0]?.name || "First Stop",
      });

      res.status(201).json({ success: true, tracking: newTracking });
    } catch (error) {
      next(error);
    }
  }
}
export default TrackingController;
