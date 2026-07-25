import { Router } from "express";
import { TrackingController } from "./TrackingController.js";
import { authenticate, authorize } from "../../middleware/AuthMiddleware.js";

const trackingRouter = Router();
const trackingCtrl = new TrackingController();

// Public telemetry submission from Driver Mobile App
trackingRouter.post("/track", trackingCtrl.receiveTelemetry.bind(trackingCtrl));
trackingRouter.post("/initialize", trackingCtrl.initializeTracking.bind(trackingCtrl));
trackingRouter.post("/stop/:busId", trackingCtrl.stopTracking.bind(trackingCtrl));

// Public tracking lookup endpoints
trackingRouter.get("/", trackingCtrl.getAllLiveTrackings.bind(trackingCtrl));
trackingRouter.get("/route/:routeId", trackingCtrl.getLiveTrackingByRouteId.bind(trackingCtrl));
trackingRouter.get("/:busId", trackingCtrl.getLiveTrackingByBusId.bind(trackingCtrl));

// Protected: only admins can delete tracking records
trackingRouter.delete("/:id", authenticate, authorize(["admin"]), trackingCtrl.deleteTracking.bind(trackingCtrl));

export default trackingRouter;
