import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import DriverModel from "./DriverModel.js";
import UserModel from "../users/UserModel.js";
import { UserRole } from "../../types/UserRole.js";
import { AuthenticatedRequest } from "../../middleware/AuthMiddleware.js";
import bcrypt from "bcryptjs";

export class DriverController {

  // Get all drivers
  async getAllDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const drivers = await DriverModel.find()
        .populate({
          path: "user",
          select: "-password",
        })
        .populate("verifiedBy", "name email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: drivers.length,
        data: drivers,
      });

    } catch (error) {
      next(error);
    }
  }

  // Get single driver
  async getDriverById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const driver = await DriverModel.findById(req.params.id)
        .populate("user", "-password")
        .populate("verifiedBy", "name email");

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: driver,
      });

    } catch (error) {
      next(error);
    }
  }

  // Create driver
  async createDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const {
        name,
        email,
        password,
        phone,
        licenseNumber,
        licenseExpiry,
        citizenshipNumber,
        address,
        dateOfBirth,
        experienceYears,
        emergencyContact,
      } = req.body;

      const existingUser = await UserModel.findOne({ email });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: "Email already exists",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: UserRole.DRIVER,
      });

      const driver = await DriverModel.create({
        user: user._id,
        licenseNumber,
        licenseExpiry,
        citizenshipNumber,
        address,
        dateOfBirth,
        experienceYears,
        emergencyContact,
      });

      const populatedDriver = await DriverModel.findById(driver._id)
        .populate("user", "-password");

      res.status(201).json({
        success: true,
        message: "Driver created successfully",
        data: populatedDriver,
      });

    } catch (error) {
      next(error);
    }
  }

  // Verify driver
  async verifyDriver(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const driver = await DriverModel.findById(req.params.id);

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
        });
        return;
      }

      driver.isVerified = true;
      driver.verifiedBy = req.user?.id ? new Types.ObjectId(req.user.id) : null;
      driver.verifiedAt = new Date();
      driver.rejectionReason = "";

      await driver.save();

      res.status(200).json({
        success: true,
        message: "Driver verified successfully",
      });

    } catch (error) {
      next(error);
    }
  }

  // Reject driver
  async rejectDriver(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const { reason } = req.body;

      const driver = await DriverModel.findById(req.params.id);

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
        });
        return;
      }

      driver.isVerified = false;
      driver.rejectionReason = reason ?? "";

      await driver.save();

      res.status(200).json({
        success: true,
        message: "Driver rejected successfully",
      });

    } catch (error) {
      next(error);
    }
  }

  // Delete driver
  async deleteDriver(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {

      const driver = await DriverModel.findById(req.params.id);

      if (!driver) {
        res.status(404).json({
          success: false,
          message: "Driver not found",
        });
        return;
      }

      await UserModel.findByIdAndDelete(driver.user);

      await driver.deleteOne();

      res.status(200).json({
        success: true,
        message: "Driver deleted successfully",
      });

    } catch (error) {
      next(error);
    }
  }
}