import { Router } from "express";
import { RouteController } from "./RouteController.js";
import { authenticate, authorize } from "../../middleware/AuthMiddleware.js";

const routesRouter = Router();
const routeCtrl = new RouteController();

routesRouter.get("/", routeCtrl.getAllRoutes.bind(routeCtrl));
routesRouter.get("/:id", routeCtrl.getRouteById.bind(routeCtrl));
routesRouter.post("/", authenticate, authorize(["admin"]), routeCtrl.createRoute.bind(routeCtrl));
routesRouter.put("/:id", authenticate, authorize(["admin"]), routeCtrl.updateRoute.bind(routeCtrl));
routesRouter.delete("/:id", authenticate, authorize(["admin"]), routeCtrl.deleteRoute.bind(routeCtrl));

export default routesRouter;
