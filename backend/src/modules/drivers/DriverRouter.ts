import { Router } from "express";
import { DriverController } from "./DriverController.js";
import { authenticate } from "../../middleware/AuthMiddleware.js";

const driverRouter = Router();
const driverCtrl = new DriverController();

// Get all drivers
driverRouter.get(
  "/",
  authenticate,
  driverCtrl.getAllDriver.bind(driverCtrl)
);

// Get driver by ID
driverRouter.get(
  "/:id",
  authenticate,
  driverCtrl.getDriverById.bind(driverCtrl)
);

// Create driver
driverRouter.post(
  "/",
  authenticate,
  driverCtrl.createDriver.bind(driverCtrl)
);

// Verify driver
driverRouter.patch(
  "/:id/verify",
  authenticate,
  driverCtrl.verifyDriver.bind(driverCtrl)
);

// Reject driver
driverRouter.patch(
  "/:id/reject",
  authenticate,
  driverCtrl.rejectDriver.bind(driverCtrl)
);

// Delete driver
driverRouter.delete(
  "/:id",
  authenticate,
  driverCtrl.deleteDriver.bind(driverCtrl)
);

export default driverRouter;