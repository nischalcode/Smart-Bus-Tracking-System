import NotificationModel from "./NotificationModel.js";
import { emitToRoles } from "../../socket/index.js";

export type RecipientRole =
  | "public_user"
  | "driver"
  | "admin"
  | "super_admin"
  | "passenger"
  | "company_admin";

export interface SystemNotificationInput {
  eventType: string;
  eventKey: string;
  title: string;
  description: string;
  recipientRoles: RecipientRole[];
  bus?: any;
  route?: any;
  driver?: any;
  cooldownMinutes?: number;
  badge?: string;
  icon?: string;
}

/** Creates deduplicated system notifications and delivers them to the correct roles in real-time. */
export class NotificationService {
  async createSystemNotification(
    input: SystemNotificationInput
  ): Promise<unknown | null> {
    const cooldownStart = new Date(
      Date.now() - (input.cooldownMinutes ?? 10) * 60_000
    );

    // Deduplication: skip if an identical event was already created within the cooldown window
    const recent = await NotificationModel.exists({
      source: "system",
      eventKey: input.eventKey,
      createdAt: { $gte: cooldownStart },
    });
    if (recent) return null;

    const notification = await NotificationModel.create({
      title: input.title,
      description: input.description,
      badge: input.badge ?? "Service Update",
      icon: input.icon ?? "BusFront",
      // Alert events get red styling; service updates get blue
      iconBg: input.badge === "Alert" ? "bg-red-100" : "bg-blue-100",
      iconColor: input.badge === "Alert" ? "text-red-500" : "text-blue-500",
      badgeBg: input.badge === "Alert" ? "bg-red-100" : "bg-blue-100",
      badgeColor: input.badge === "Alert" ? "text-red-600" : "text-blue-600",
      source: "system",
      eventType: input.eventType,
      eventKey: input.eventKey,
      recipientRoles: input.recipientRoles,
      bus: input.bus,
      route: input.route,
      driver: input.driver,
    });

    try {
      // Targeted delivery: only emit to sockets whose authenticated role is in recipientRoles.
      // Unauthed sockets (public passengers) also receive passenger-targeted events.
      emitToRoles(input.recipientRoles, "notification:new", notification);
    } catch {
      // Socket delivery is optional; the persisted notification is always retrievable via REST.
    }

    return notification;
  }
}

export default NotificationService;
