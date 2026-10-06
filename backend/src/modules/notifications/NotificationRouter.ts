import { Router } from "express";
import { NotificationController } from "./NotificationController.js";
import { validateBody } from "../../middleware/ValidatorMiddleware.js";
import { authenticate, authorize } from "../../middleware/AuthMiddleware.js";

const notificationsRouter = Router();
const notificationCtrl = new NotificationController();

// Public / role-filtered listing (public users, drivers, admin dashboard)
notificationsRouter.get("/", notificationCtrl.getAllNotifications.bind(notificationCtrl));

// Unread notifications for a given role — used by frontend on socket reconnect
notificationsRouter.get("/unread", notificationCtrl.getUnreadByRole.bind(notificationCtrl));

// Admin-only: create manual announcement
notificationsRouter.post(
  "/",
  authenticate,
  authorize(["admin", "super_admin"]),
  validateBody(["title", "description", "badge", "icon"]),
  notificationCtrl.createNotification.bind(notificationCtrl)
);

// Admin-only: update existing notification
notificationsRouter.put(
  "/:id",
  authenticate,
  authorize(["admin", "super_admin"]),
  notificationCtrl.updateNotification.bind(notificationCtrl)
);

// Admin-only: delete notification
notificationsRouter.delete(
  "/:id",
  authenticate,
  authorize(["admin", "super_admin"]),
  notificationCtrl.deleteNotification.bind(notificationCtrl)
);

// Authenticated: mark a single notification as read
notificationsRouter.patch(
  "/:id/read",
  authenticate,
  notificationCtrl.markAsRead.bind(notificationCtrl)
);

// Authenticated: mark all notifications as read
notificationsRouter.post(
  "/mark-all-read",
  authenticate,
  notificationCtrl.markAllAsRead.bind(notificationCtrl)
);

export default notificationsRouter;
