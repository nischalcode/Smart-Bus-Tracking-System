import { Request, Response, NextFunction } from "express";
import BusModel from "./BusModel.js";

export class BusController {
  async getAllBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const [buses, total] = await Promise.all([
        BusModel.find({}).populate("driver", "-password").skip(skip).limit(limit),
        BusModel.countDocuments({}),
      ]);
      res.status(200).json({ success: true, buses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      next(error);
    }
  }

  async getBusById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bus = await BusModel.findById(id).populate("driver", "-password");
      if (!bus) {
        res.status(404).json({ success: false, message: "Bus not found." });
        return;
      }
      res.status(200).json({ success: true, bus });
    } catch (error) {
      next(error);
    }
  }

  async createBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { busNumber, modelName, capacity, status, driver } = req.body;
      const newBus = await BusModel.create({
        busNumber,
        modelName,
        capacity,
        status,
        driver: driver || null,
      });
      res.status(201).json({ success: true, bus: newBus });
    } catch (error) {
      next(error);
    }
  }

  async updateBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { busNumber, modelName, capacity, status, driver } = req.body;
      const bus = await BusModel.findByIdAndUpdate(id, { busNumber, modelName, capacity, status, driver }, { new: true, runValidators: true });
      if (!bus) {
        res.status(404).json({ success: false, message: "Bus not found." });
        return;
      }
      res.status(200).json({ success: true, bus });
    } catch (error) {
      next(error);
    }
  }

  async deleteBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bus = await BusModel.findByIdAndDelete(id);
      if (!bus) {
        res.status(404).json({ success: false, message: "Bus not found." });
        return;
      }
      res.status(200).json({ success: true, message: "Bus deleted successfully." });
    } catch (error) {
      next(error);
    }
  }
}
export default BusController;
