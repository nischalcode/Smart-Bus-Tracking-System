import { Request, Response, NextFunction } from "express";
import RouteModel from "./RouteModel.js";

export class RouteController {
  async getAllRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const [routes, total] = await Promise.all([
        RouteModel.find({}).skip(skip).limit(limit),
        RouteModel.countDocuments({}),
      ]);
      res.status(200).json({ success: true, routes, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }

  async getRouteById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const route = await RouteModel.findById(id);
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }
      res.status(200).json({ success: true, route });
    } catch (error) {
      next(error);
    }
  }

  async createRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        routeNo,
        from,
        to,
        via,
        frequency,
        status,
        color,
        active,
        stops,
        pathCoordinates,
      } = req.body;

      const newRoute = await RouteModel.create({
        routeNo,
        from,
        to,
        via,
        frequency,
        status,
        color,
        active,
        stops,
        pathCoordinates,
      });

      res.status(201).json({ success: true, route: newRoute });
    } catch (error) {
      next(error);
    }
  }

  async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { routeNo, from, to, via, frequency, status, color, active, stops, pathCoordinates } = req.body;
      const route = await RouteModel.findByIdAndUpdate(id, { routeNo, from, to, via, frequency, status, color, active, stops, pathCoordinates }, { new: true, runValidators: true });
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }
      res.status(200).json({ success: true, route });
    } catch (error) {
      next(error);
    }
  }

  async deleteRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const route = await RouteModel.findByIdAndDelete(id);
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }
      res.status(200).json({ success: true, message: "Route deleted successfully." });
    } catch (error) {
      next(error);
    }
  }
}
export default RouteController;
