import { Router } from "express";
import JourneyController from "./JourneyController.js";

const journeyRouter = Router();
const controller = new JourneyController();

// POST /api/journey/recommend — public, no auth required
journeyRouter.post("/recommend", (req, res, next) =>
  controller.recommend(req, res, next)
);

export default journeyRouter;
