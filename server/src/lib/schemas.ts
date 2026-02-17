import { z } from "zod";

// Request schemas
export const GetNextQuestionSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
});

export const SubmitAnswerSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().min(1),
  stateVersion: z.number().int().positive(),
  answerIdempotencyKey: z.string().uuid(),
});

export const GetMetricsSchema = z.object({
  userId: z.string().uuid(),
});

// Response types
export interface NextQuestionResponse {
  questionId: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  sessionId: string;
  stateVersion: number;
  currentScore: number;
  currentStreak: number;
  maxStreak: number;
  currentDifficulty: number;
}

export interface AnswerResponse {
  correct: boolean;
  newDifficulty: number;
  newStreak: number;
  scoreDelta: number;
  totalScore: number;
  stateVersion: number;
  maxStreak: number;
  leaderboardRankScore: number | null;
  leaderboardRankStreak: number | null;
}

export interface MetricsResponse {
  currentDifficulty: number;
  streak: number;
  maxStreak: number;
  totalScore: number;
  accuracy: number;
  totalAnswers: number;
  correctAnswers: number;
  momentum: number;
  recentCorrect: number;
  recentTotal: number;
  difficultyHistogram: number[];
  recentPerformance: boolean[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  value: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number | null;
  userValue: number | null;
}
