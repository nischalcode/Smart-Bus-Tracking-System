import { Request, Response, NextFunction } from "express";
import JourneyRecommendationService from "./JourneyRecommendationService.js";

const service = new JourneyRecommendationService();

export class JourneyController {
  /**
   * POST /api/journey/recommend
   * Body: { origin: string, destination: string }
   */
  async recommend(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        res.status(400).json({
          success: false,
          message: "Both origin and destination are required.",
        });
        return;
      }

      if (
        typeof origin !== "string" ||
        typeof destination !== "string" ||
        origin.trim().length === 0 ||
        destination.trim().length === 0
      ) {
        res.status(400).json({
          success: false,
          message: "Origin and destination must be non-empty strings.",
        });
        return;
      }

      const recommendations = await service.recommend(
        origin.trim(),
        destination.trim()
      );

      res.status(200).json({
        success: true,
        count: recommendations.length,
        recommendations,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default JourneyController;
