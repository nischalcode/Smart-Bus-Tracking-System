import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

export interface CustomError extends Error {
  statusCode?: number;
}

function getDuplicateFieldName(error: unknown): string {
  if (!error || typeof error !== "object") return "value";
  const mongoError = error as { keyPattern?: Record<string, unknown>; keyValue?: Record<string, unknown> };
  const fields = mongoError.keyPattern
    ? Object.keys(mongoError.keyPattern)
    : mongoError.keyValue
      ? Object.keys(mongoError.keyValue)
      : [];
  return fields[0] ?? "value";
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err && typeof err === "object" && (err as { code?: unknown }).code === 11000) {
    const field = getDuplicateFieldName(err);
    res.status(409).json({
      success: false,
      message: `Duplicate ${field}: a record with this ${field} already exists.`,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [key, val] of Object.entries(err.errors)) {
      errors[key] = val.message;
    }
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  const customErr = err as CustomError;
  const statusCode = customErr.statusCode || 500;
  const message = customErr.message || "Internal Server Error";

  console.error(`[Error] ${req.method} ${req.url} - ${message}`);

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Internal Server Error" : message,
  });
};
