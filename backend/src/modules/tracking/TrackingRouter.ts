import { Router } from "express";
import { TrackingController } from "./TrackingController.js";
import { validateBody } from "../../middleware/ValidatorMiddleware.js";
import { authenticate, authorize } from "../../middleware/AuthMiddleware.js";

const trackingRouter = Router();
const trackingCtrl = new TrackingController();

trackingRouter.get("/", trackingCtrl.getAllLiveTrackings.bind(trackingCtrl));
trackingRouter.get("/:busId", trackingCtrl.getLiveTrackingByBusId.bind(trackingCtrl));
trackingRouter.post("/initialize", authenticate, authorize(["admin"]), validateBody(["bus", "route"]), trackingCtrl.initializeTracking.bind(trackingCtrl));

export default trackingRouter;
