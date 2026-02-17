import { Router, Request, Response, NextFunction } from "express";
import {
  getNextQuestion,
  submitAnswer,
  getUserMetrics,
} from "../services/quizService.js";
import {
  GetNextQuestionSchema,
  SubmitAnswerSchema,
  GetMetricsSchema,
} from "../lib/schemas.js";
import { ZodError } from "zod";

export const quizRouter = Router();

/**
 * GET /v1/quiz/next
 * Get the next question for a user
 */
quizRouter.get(
  "/next",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = GetNextQuestionSchema.safeParse({
        userId: req.query.userId,
        sessionId: req.query.sessionId,
      });

      if (!validation.success) {
        res
          .status(400)
          .json({ error: "Invalid request", details: validation.error.errors });
        return;
      }

      const { userId, sessionId } = validation.data;
      const result = await getNextQuestion(userId, sessionId);

      if (!result) {
        res.status(404).json({ error: "Unable to get next question" });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /v1/quiz/answer
 * Submit an answer with idempotency
 */
quizRouter.post(
  "/answer",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = SubmitAnswerSchema.safeParse(req.body);

      if (!validation.success) {
        res
          .status(400)
          .json({ error: "Invalid request", details: validation.error.errors });
        return;
      }

      const { userId, questionId, answer, stateVersion, answerIdempotencyKey } =
        validation.data;
      const result = await submitAnswer(
        userId,
        questionId,
        answer,
        stateVersion,
        answerIdempotencyKey,
      );

      if (!result) {
        res
          .status(409)
          .json({
            error:
              "State version conflict or invalid question. Please refresh and try again.",
          });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /v1/quiz/metrics
 * Get user performance metrics
 */
quizRouter.get(
  "/metrics",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = GetMetricsSchema.safeParse({
        userId: req.query.userId,
      });

      if (!validation.success) {
        res
          .status(400)
          .json({ error: "Invalid request", details: validation.error.errors });
        return;
      }

      const { userId } = validation.data;
      const result = await getUserMetrics(userId);

      if (!result) {
        res.status(404).json({ error: "User metrics not found" });
        return;
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
