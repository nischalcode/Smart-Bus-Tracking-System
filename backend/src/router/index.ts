import { Router } from "express";
import authRouter from "../modules/auth/AuthRouter.js";
import busesRouter from "../modules/buses/BusRouter.js";
import routesRouter from "../modules/routes/RouteRouter.js";
import schedulesRouter from "../modules/schedules/ScheduleRouter.js";
import trackingRouter from "../modules/tracking/TrackingRouter.js";
import notificationsRouter from "../modules/notifications/NotificationRouter.js";
import dashboardRouter from "../modules/dashboard/DashboardRouter.js";
import usersRouter from "../modules/users/UserRouter.js";
import bannersRouter from "../modules/banners/BannerRouter.js";
import teamsRouter from "../modules/teams/TeamRouter.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/buses", busesRouter);
router.use("/routes", routesRouter);
router.use("/schedules", schedulesRouter);
router.use("/tracking", trackingRouter);
router.use("/notifications", notificationsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);
router.use("/banners", bannersRouter);
router.use("/teams", teamsRouter);

export default router;