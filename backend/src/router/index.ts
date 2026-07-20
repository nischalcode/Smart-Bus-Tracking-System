import { Router } from "express";
import authRouter from "../modules/auth/AuthRouter.js";
import busesRouter from "../modules/buses/BusRouter.js";
// import companyRouter from "../modules/company/CompanyRouter.js";
import routesRouter from "../modules/routes/RouteRouter.js";
import driverRouter from "../modules/drivers/DriverRouter.js";
import schedulesRouter from "../modules/schedules/ScheduleRouter.js";
import trackingRouter from "../modules/tracking/TrackingRouter.js";
import notificationsRouter from "../modules/notifications/NotificationRouter.js";
import dashboardRouter from "../modules/dashboard/DashboardRouter.js";
import usersRouter from "../modules/users/UserRouter.js";
import bannersRouter from "../modules/banners/BannerRouter.js";
import teamsRouter from "../modules/teams/TeamRouter.js";
import tripRouter from "../modules/trips/TripRouter.js";

const router = Router();

router.use("/api/auth", authRouter);

router.use("/api/users", usersRouter);
router.use("/api/drivers", driverRouter);
router.use("/api/buses", busesRouter);
router.use("/api/routes", routesRouter);
router.use("/api/trips", tripRouter);
router.use("/api/schedules", schedulesRouter);
router.use("/api/tracking", trackingRouter);
router.use("/api/dashboard", dashboardRouter);
router.use("/api/notifications", notificationsRouter);
router.use("/api/banners", bannersRouter);
router.use("/api/teams", teamsRouter);

// Future
// router.use("/api/companies", companyRouter);

export default router;