import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import RouteModel from "./RouteModel.js";

interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

function isValidCoordinate(coord: unknown): coord is [number, number] {
  if (!Array.isArray(coord) || coord.length < 2) return false;
  const [lat, lng] = coord;
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

function validateRouteFields(body: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};

  const requiredStrings = ["routeNo", "from", "to", "frequency"] as const;
  for (const field of requiredStrings) {
    const value = body[field];
    if (typeof value !== "string" || value.trim() === "") {
      errors[field] = `${field} is required`;
    }
  }

  if (!Array.isArray(body.pathCoordinates) || body.pathCoordinates.length < 2) {
    errors.pathCoordinates = "At least 2 path coordinates are required";
  } else {
    for (let i = 0; i < body.pathCoordinates.length; i++) {
      if (!isValidCoordinate(body.pathCoordinates[i])) {
        errors.pathCoordinates = `Invalid coordinate at index ${i}: expected [lat, lng] with valid ranges`;
        break;
      }
    }
  }

  if (body.stops !== undefined) {
    if (!Array.isArray(body.stops)) {
      errors.stops = "stops must be an array";
    } else {
      for (let i = 0; i < body.stops.length; i++) {
        const stop = body.stops[i] as Record<string, unknown>;
        if (!stop || typeof stop.name !== "string" || stop.name.trim() === "") {
          errors[`stops[${i}].name`] = "Stop name is required";
        }
        if (stop.timeOffset !== undefined && typeof stop.timeOffset !== "number") {
          errors[`stops[${i}].timeOffset`] = "timeOffset must be a number";
        }
        if (stop.type !== undefined && !["start", "stop", "end"].includes(stop.type as string)) {
          errors[`stops[${i}].type`] = "type must be start, stop, or end";
        }
      }
    }
  }

  if (body.active !== undefined && typeof body.active !== "boolean") {
    errors.active = "active must be a boolean";
  }

  if (body.via !== undefined && typeof body.via !== "string") {
    errors.via = "via must be a string";
  }

  if (body.status !== undefined && typeof body.status !== "string") {
    errors.status = "status must be a string";
  }

  if (body.color !== undefined && typeof body.color !== "string") {
    errors.color = "color must be a string";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function sanitizeRouteBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  sanitized.routeNo = typeof body.routeNo === "string" ? body.routeNo.trim() : body.routeNo;
  sanitized.from = typeof body.from === "string" ? body.from.trim() : body.from;
  sanitized.to = typeof body.to === "string" ? body.to.trim() : body.to;
  sanitized.via =
    typeof body.via === "string" && body.via.trim() !== "" ? body.via.trim() : undefined;
  sanitized.frequency = typeof body.frequency === "string" ? body.frequency.trim() : body.frequency;
  sanitized.status =
    typeof body.status === "string" && body.status.trim() !== ""
      ? body.status.trim()
      : "On Time";
  sanitized.active = typeof body.active === "boolean" ? body.active : true;
  sanitized.pathCoordinates = body.pathCoordinates;
  sanitized.stops = Array.isArray(body.stops) ? body.stops : undefined;

  return sanitized;
}

function handleRouteSaveError(error: unknown, res: Response, next: NextFunction): void {
  if (error && typeof error === "object" && (error as { code?: unknown }).code === 11000) {
    res.status(409).json({
      success: false,
      message: "Route number already exists. Please use a different route number.",
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(error.errors)) {
      errors[key] = val.message;
    }
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`,
    });
    return;
  }

  next(error);
}

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
      handleRouteSaveError(error, res, next);
    }
  }

  async createRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = validateRouteFields(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const payload = sanitizeRouteBody(req.body);
      const newRoute = await RouteModel.create(payload);

      res.status(201).json({ success: true, route: newRoute });
    } catch (error) {
      handleRouteSaveError(error, res, next);
    }
  }

  async updateRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id as string)) {
        res.status(400).json({ success: false, message: "Invalid route ID." });
        return;
      }

      const validation = validateRouteFields(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const payload = sanitizeRouteBody(req.body);
      const route = await RouteModel.findByIdAndUpdate(id as string, payload, { new: true, runValidators: true });
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }
      res.status(200).json({ success: true, route });
    } catch (error) {
      handleRouteSaveError(error, res, next);
    }
  }

  async deleteRoute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id as string)) {
        res.status(400).json({ success: false, message: "Invalid route ID." });
        return;
      }
      const route = await RouteModel.findByIdAndDelete(id as string);
      if (!route) {
        res.status(404).json({ success: false, message: "Route not found." });
        return;
      }
      res.status(200).json({ success: true, message: "Route deleted successfully." });
    } catch (error) {
      handleRouteSaveError(error, res, next);
    }
  }
}
export default RouteController;
