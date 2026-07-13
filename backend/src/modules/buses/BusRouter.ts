import { Router } from "express";
import { BusController } from "./BusController.js";
import { validateBody } from "../../middleware/ValidatorMiddleware.js";
import { authenticate, authorize } from "../../middleware/AuthMiddleware.js";

const busesRouter = Router();
const busCtrl = new BusController();

busesRouter.get("/", busCtrl.getAllBuses.bind(busCtrl));
busesRouter.get("/:id", busCtrl.getBusById.bind(busCtrl));
busesRouter.post("/", authenticate, authorize(["admin"]), validateBody(["busNumber"]), busCtrl.createBus.bind(busCtrl));
busesRouter.put("/:id", authenticate, authorize(["admin"]), busCtrl.updateBus.bind(busCtrl));
busesRouter.delete("/:id", authenticate, authorize(["admin"]), busCtrl.deleteBus.bind(busCtrl));

export default busesRouter;
