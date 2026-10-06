import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    badge: { type: String, required: true }, // Alert, Service Update, Promotion, General
    icon: { type: String, required: true }, // TriangleAlert, BusFront, CircleX, Megaphone, Gift, Construction
    iconBg: { type: String, default: "bg-red-100" },
    iconColor: { type: String, default: "text-red-500" },
    badgeBg: { type: String, default: "bg-red-100" },
    badgeColor: { type: String, default: "text-red-600" },
    read: { type: Boolean, default: false },
    // Optional event metadata keeps manual announcements fully compatible.
    source: { type: String, enum: ["manual", "system"], default: "manual" },
    eventType: { type: String },
    eventKey: { type: String },
    recipientRoles: [{ type: String, enum: ["public_user", "driver", "admin", "super_admin", "passenger", "company_admin"] }],
    bus: { type: Schema.Types.ObjectId, ref: "Bus" },
    route: { type: Schema.Types.ObjectId, ref: "Route" },
    driver: { type: Schema.Types.ObjectId, ref: "Driver" },
  },
  { timestamps: true }
);

export const NotificationModel = model("Notification", notificationSchema);
export default NotificationModel;
