import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import NotificationModel from "../modules/notifications/NotificationModel.js";
import { normalizeUserRole, UserRole } from "../types/UserRole.js";
import { registerLocationSocket } from "./location.socket.js";

let io: Server;

/**
 * Maps socket.id → role so we can target notifications by recipient role.
 * Role is supplied by the client via a "auth" event right after connection.
 */
const socketRoles = new Map<string, string>();

/** Emit an event to every connected socket whose role is in the given list. */
export function emitToRoles(
  roles: string[],
  event: string,
  data: unknown
): void {
  if (!io) return;

  const normalizedTargets = roles.map((role) => normalizeUserRole(role));
  io.sockets.sockets.forEach((socket) => {
    const role = normalizeUserRole(socketRoles.get(socket.id));
    const matchesRole =
      !role ||
      normalizedTargets.some((targetRole) => {
        if (targetRole === role) return true;
        if (targetRole === UserRole.ADMIN && role === UserRole.SUPER_ADMIN) return true;
        if (targetRole === UserRole.SUPER_ADMIN && role === UserRole.ADMIN) return true;
        return false;
      });
    // Broadcast to matching roles; also broadcast to unauthed sockets for
    // backwards-compat (public users browsing without being logged in).
    if (matchesRole) {
      socket.emit(event, data);
    }
  });
}

/**
 * Deliver all unread notifications relevant to `role` to a single socket.
 * Called when a client (re)connects and authenticates.
 */
async function deliverUnread(socket: Socket, role: string): Promise<void> {
  try {
    const normalizedRole = normalizeUserRole(role);
    const isAdminRole = normalizedRole === UserRole.ADMIN || normalizedRole === UserRole.SUPER_ADMIN;
    const filter: Record<string, unknown> =
      isAdminRole
        ? { read: false }
        : {
            read: false,
            $or: [{ source: "manual" }, { recipientRoles: normalizedRole }],
          };

    const unread = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (unread.length > 0) {
      socket.emit("notifications:unread", unread);
    }
  } catch {
    // Non-critical — client can still poll via REST
  }
}

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // Register location-update handler (driver mobile app)
    registerLocationSocket(io, socket);

    /**
     * Client sends { role } immediately after connecting so we can target
     * role-specific notifications. Unauthenticated / public clients may skip
     * this and will receive only manual (admin-broadcast) notifications.
     */
    socket.on("auth", async (payload: { token?: string }) => {
      // Roles are derived from the existing JWT, never trusted from the client.
      let role: string = UserRole.PUBLIC_USER;
      if (payload?.token && process.env.JWT_SECRET) {
        try {
          const decoded = jwt.verify(payload.token, process.env.JWT_SECRET) as { role?: string };
          const normalizedRole = normalizeUserRole(decoded.role);
          const allowedRoles: string[] = [
            UserRole.PUBLIC_USER,
            UserRole.DRIVER,
            UserRole.ADMIN,
            UserRole.SUPER_ADMIN,
            UserRole.LEGACY_PUBLIC_USER,
            UserRole.LEGACY_COMPANY_ADMIN,
          ];
          if (allowedRoles.includes(normalizedRole)) {
            role = normalizedRole;
          }
        } catch {
          // Public users remain supported without a token.
        }
      }
      socketRoles.set(socket.id, role);
      console.log(`Socket ${socket.id} authenticated as ${role}`);
      // Deliver any unread notifications the client missed while offline
      await deliverUnread(socket, role);
    });

    socket.on("disconnect", () => {
      socketRoles.delete(socket.id);
      console.log("Client disconnected:", socket.id);
    });
  });
};

export const getIO = () => io;
