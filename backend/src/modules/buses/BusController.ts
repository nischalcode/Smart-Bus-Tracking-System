import { Request, Response, NextFunction } from "express";
import BusModel from "./BusModel.js";
import DriverModel from "../drivers/DriverModel.js";

export class BusController {
  async getAllBuses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const skip = (page - 1) * limit;
      const [buses, total] = await Promise.all([
        BusModel.find({}).populate({
          path: "assignedDriver",
          populate: {
            path: "user",
            select: "name email phone",
          },
        }).populate("assignedRoute").skip(skip).limit(limit),
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
      const bus = await BusModel.findById(id).populate({
        path: "assignedDriver",
        populate: {
            path: "user",
            select: "name email phone",
        },
      }).populate("assignedRoute")
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
      const { busNumber, modelName, capacity, status } = req.body;
      const newBus = await BusModel.create({
        busNumber,
        modelName,
        capacity,
        status,
        // driver: driver || null,
      });
      res.status(201).json({ success: true, bus: newBus });
    } catch (error) {
      next(error);
    }
  }

  async updateBus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { busNumber, modelName, capacity, status } = req.body;
      const bus = await BusModel.findByIdAndUpdate(id, { busNumber, modelName, capacity, status}, { new: true, runValidators: true });
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

  async assignDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const { driverId } = req.body;
      const busId = req.params.id;

      const bus = await BusModel.findById(busId);

      if (!bus) {
        res.status(404).json({
          success: false,
          message: "Bus not found"
        });
        return;
      }

      const driver = await DriverModel.findById(driverId);

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found"
        });
        return;
      }

      if (!driver.isVerified) {
        res.status(400).json({
          success: false,
          message: "Driver is not verified"
        });
        return;
      }

      if (driver.assignedBus) {
        res.status(400).json({
          success: false,
          message: "Driver is already assigned to another bus"
        });
        return;
      }

      if (bus.assignedDriver) {
        const oldDriver = await DriverModel.findById(bus.assignedDriver);

        if (oldDriver) {
            oldDriver.assignedBus = null;
            await oldDriver.save();
        }
      }

      bus.assignedDriver = driver._id;

      driver.assignedBus = bus._id;

      await driver.save();
      await bus.save();

      res.status(200).json({
        success: true,
        message: "Driver assigned successfully"
      });

    } catch (error) {
      next(error);
    }
  }

  async removeDriver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try{
      const bus = await BusModel.findById(req.params.id);

      if (!bus) {
          res.status(404).json({
              success: false,
              message: "Bus not found",
          });
          return;
      }

      if (!bus.assignedDriver) {
          res.status(400).json({
              success: false,
              message: "No driver assigned",
          });
          return;
      }

      const driver = await DriverModel.findById(bus.assignedDriver);

      if (driver) {
          driver.assignedBus = null;
          await driver.save();
      }

      bus.assignedDriver = null;
      await bus.save();

      res.status(200).json({
          success: true,
          message: "Driver removed successfully",
      });

    } catch (error) {
        next(error);
    }
  }
}
export default BusController;
