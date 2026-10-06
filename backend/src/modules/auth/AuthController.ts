import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../users/UserModel.js";
import { AuthenticatedRequest } from "../../middleware/AuthMiddleware.js";
import { normalizeUserRole, UserRole } from "../../types/UserRole.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password, role } = req.body;
      if ([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DRIVER].includes(role)) {
        res.status(400).json({ success: false, message: "Only public user registrations are allowed from this endpoint." });
        return;
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        res.status(400).json({ success: false, message: "User with this email already exists." });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserModel.create({
        name,
        email,
        password: hashedPassword,
        role: UserRole.PUBLIC_USER,
      });

      const normalizedRole = normalizeUserRole(user.role);
      const token = jwt.sign(
        { id: user._id, role: normalizedRole, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findOne({ email });
      if (!user) {
        res.status(401).json({ success: false, message: "Invalid email or password." });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ success: false, message: "Invalid email or password." });
        return;
      }

      const normalizedRole = normalizeUserRole(user.role);
      const token = jwt.sign(
        { id: user._id, role: normalizedRole, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(200).json({
        success: true,
        message: "Logged in successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Not authenticated." });
        return;
      }

      const user = await UserModel.findById(req.user.id).select("-password");
      if (!user) {
        res.status(404).json({ success: false, message: "User not found." });
        return;
      }

      const normalizedRole = normalizeUserRole(user.role);
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: normalizedRole,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}