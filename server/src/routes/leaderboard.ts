import { Router, Request, Response, NextFunction } from "express";
import {
  getScoreLeaderboard,
  getStreakLeaderboard,
} from "../services/leaderboardService.js";

export const leaderboardRouter = Router();

/**
 * GET /v1/leaderboard/score
 * Get top users by total score
 */
leaderboardRouter.get(
  "/score",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 50, 100);

      const result = await getScoreLeaderboard(userId, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /v1/leaderboard/streak
 * Get top users by max streak
 */
leaderboardRouter.get(
  "/streak",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string | undefined;
      const limit = Math.min(Number(req.query.limit) || 50, 100);

      const result = await getStreakLeaderboard(userId, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
