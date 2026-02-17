import { supabase } from "../lib/supabase.js";
import { getRedis, CACHE_KEYS, CACHE_TTL } from "../lib/redis.js";
import {
  processAnswer,
  calculateStreakDecay,
  UserState,
} from "../lib/adaptive.js";
import { v4 as uuidv4 } from "uuid";
import type {
  NextQuestionResponse,
  AnswerResponse,
  MetricsResponse,
} from "../lib/schemas.js";

interface Question {
  id: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  correct_answer: string;
  category: string;
}

interface UserStateRow extends UserState {
  user_id: string;
  last_question_id: string | null;
  last_answer_at: string | null;
}

const DEFAULT_STATE: Omit<UserStateRow, "user_id"> = {
  current_difficulty: 3,
  streak: 0,
  max_streak: 0,
  total_score: 0,
  total_answers: 0,
  correct_answers: 0,
  last_question_id: null,
  last_answer_at: null,
  state_version: 1,
  momentum: 0,
  recent_correct: 0,
  recent_total: 0,
};

/**
 * Get or create user state with optional caching
 */
async function getUserState(userId: string): Promise<UserStateRow | null> {
  const redis = getRedis();
  const cacheKey = CACHE_KEYS.userState(userId);

  // Try cache first
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Fetch from DB
  const { data, error } = await supabase
    .from("user_state")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user state:", error);
    return null;
  }

  if (!data) {
    // Create new user state
    const newState = { ...DEFAULT_STATE, user_id: userId };
    const { data: created, error: createErr } = await supabase
      .from("user_state")
      .insert(newState)
      .select()
      .single();

    if (createErr) {
      console.error("Error creating user state:", createErr);
      return null;
    }

    // Create leaderboard entries
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();

    const username = (profile as any)?.username || "Player";
    await supabase
      .from("leaderboard_score")
      .insert({ user_id: userId, username, total_score: 0 });
    await supabase
      .from("leaderboard_streak")
      .insert({ user_id: userId, username, max_streak: 0 });

    return created as UserStateRow;
  }

  const state = data as UserStateRow;

  // Cache the state
  if (redis) {
    await redis.setex(cacheKey, CACHE_TTL.userState, JSON.stringify(state));
  }

  return state;
}

/**
 * Update user state with cache invalidation
 */
async function updateUserState(
  userId: string,
  updates: Partial<UserStateRow>,
  expectedVersion: number,
): Promise<boolean> {
  const { error } = await supabase
    .from("user_state")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("state_version", expectedVersion);

  if (error) {
    console.error("Error updating user state:", error);
    return false;
  }

  // Invalidate cache
  const redis = getRedis();
  if (redis) {
    await redis.del(CACHE_KEYS.userState(userId));
  }

  return true;
}

/**
 * Get question pool for a difficulty with caching
 */
async function getQuestionPool(difficulty: number): Promise<Question[]> {
  const redis = getRedis();
  const cacheKey = CACHE_KEYS.questionPool(difficulty);

  // Try cache first
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Fetch from DB - get questions within difficulty range
  const roundedDiff = Math.round(difficulty);
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .gte("difficulty", Math.max(1, roundedDiff - 1))
    .lte("difficulty", Math.min(10, roundedDiff + 1));

  if (error || !data) {
    console.error("Error fetching questions:", error);
    return [];
  }

  const questions = data as Question[];

  // Cache the pool
  if (redis) {
    await redis.setex(
      cacheKey,
      CACHE_TTL.questionPool,
      JSON.stringify(questions),
    );
  }

  return questions;
}

/**
 * Get next question for user
 */
export async function getNextQuestion(
  userId: string,
  sessionId?: string,
): Promise<NextQuestionResponse | null> {
  let state = await getUserState(userId);
  if (!state) return null;

  // Check for streak decay
  const { decayedStreak, decayApplied } = calculateStreakDecay(
    state.streak,
    state.last_answer_at,
  );
  if (decayApplied) {
    await updateUserState(
      userId,
      { streak: decayedStreak, state_version: state.state_version + 1 },
      state.state_version,
    );
    state = {
      ...state,
      streak: decayedStreak,
      state_version: state.state_version + 1,
    };
  }

  // Get question pool
  const pool = await getQuestionPool(state.current_difficulty);
  if (pool.length === 0) {
    // Fallback to any difficulty
    const { data: fallback } = await supabase
      .from("questions")
      .select("*")
      .limit(10);
    if (!fallback?.length) return null;
    pool.push(...(fallback as Question[]));
  }

  // Filter out last question
  const available = pool.filter((q) => q.id !== state!.last_question_id);
  const questions = available.length > 0 ? available : pool;

  // Prefer exact difficulty match
  const roundedDiff = Math.round(state.current_difficulty);
  const exact = questions.filter((q) => q.difficulty === roundedDiff);
  const finalPool = exact.length > 0 ? exact : questions;

  // Random selection
  const question = finalPool[Math.floor(Math.random() * finalPool.length)];

  return {
    questionId: question.id,
    difficulty: question.difficulty,
    prompt: question.prompt,
    choices: question.choices,
    sessionId: sessionId || uuidv4(),
    stateVersion: state.state_version,
    currentScore: Number(state.total_score),
    currentStreak: state.streak,
    maxStreak: state.max_streak,
    currentDifficulty: Number(state.current_difficulty),
  };
}

/**
 * Submit answer with idempotency check
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  answer: string,
  stateVersion: number,
  idempotencyKey: string,
): Promise<AnswerResponse | null> {
  // Check idempotency - prevent duplicate submissions
  const { data: existingAnswer } = await supabase
    .from("answer_log")
    .select("*")
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .single();

  if (existingAnswer) {
    // Return cached response for duplicate request
    const state = await getUserState(userId);
    if (!state) return null;

    const { userRank: scoreRank } = await getLeaderboardRank(userId, "score");
    const { userRank: streakRank } = await getLeaderboardRank(userId, "streak");

    return {
      correct: (existingAnswer as any).correct,
      newDifficulty: Number(state.current_difficulty),
      newStreak: state.streak,
      scoreDelta: Number((existingAnswer as any).score_delta),
      totalScore: Number(state.total_score),
      stateVersion: state.state_version,
      maxStreak: state.max_streak,
      leaderboardRankScore: scoreRank,
      leaderboardRankStreak: streakRank,
    };
  }

  // Get current state and verify version (optimistic concurrency)
  const state = await getUserState(userId);
  if (!state || state.state_version !== stateVersion) {
    return null; // Version conflict - client should refresh
  }

  // Get question and check answer
  const { data: question, error } = await supabase
    .from("questions")
    .select("correct_answer")
    .eq("id", questionId)
    .single();

  if (error || !question) return null;

  const correct = answer === (question as any).correct_answer;

  // Process the answer
  const { newState, scoreDelta } = processAnswer(
    {
      current_difficulty: Number(state.current_difficulty),
      streak: state.streak,
      max_streak: state.max_streak,
      total_score: Number(state.total_score),
      total_answers: state.total_answers,
      correct_answers: state.correct_answers,
      momentum: Number(state.momentum),
      recent_correct: state.recent_correct,
      recent_total: state.recent_total,
      state_version: state.state_version,
      last_answer_at: state.last_answer_at,
    },
    correct,
  );

  // Log the answer
  await supabase.from("answer_log").insert({
    user_id: userId,
    question_id: questionId,
    difficulty_at_answer: state.current_difficulty,
    answer,
    correct,
    score_delta: scoreDelta,
    streak_at_answer: state.streak,
    idempotency_key: idempotencyKey,
  });

  // Update user state
  const updated = await updateUserState(
    userId,
    {
      ...newState,
      last_question_id: questionId,
      last_answer_at: new Date().toISOString(),
    },
    state.state_version,
  );

  if (!updated) return null;

  // Update leaderboards
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();
  const username = (profile as any)?.username || "Player";

  await supabase.from("leaderboard_score").upsert({
    user_id: userId,
    username,
    total_score: newState.total_score!,
    updated_at: new Date().toISOString(),
  });

  await supabase.from("leaderboard_streak").upsert({
    user_id: userId,
    username,
    max_streak: newState.max_streak!,
    updated_at: new Date().toISOString(),
  });

  // Get updated leaderboard ranks
  const { userRank: scoreRank } = await getLeaderboardRank(userId, "score");
  const { userRank: streakRank } = await getLeaderboardRank(userId, "streak");

  return {
    correct,
    newDifficulty: newState.current_difficulty!,
    newStreak: newState.streak!,
    scoreDelta,
    totalScore: newState.total_score!,
    stateVersion: newState.state_version!,
    maxStreak: newState.max_streak!,
    leaderboardRankScore: scoreRank,
    leaderboardRankStreak: streakRank,
  };
}

/**
 * Get user metrics
 */
export async function getUserMetrics(
  userId: string,
): Promise<MetricsResponse | null> {
  const state = await getUserState(userId);
  if (!state) return null;

  // Get difficulty histogram from answer logs
  const { data: answerLogs } = await supabase
    .from("answer_log")
    .select("difficulty_at_answer, correct")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false });

  const histogram = Array(10).fill(0);
  const recentPerformance: boolean[] = [];

  if (answerLogs) {
    answerLogs.forEach((log: any, index: number) => {
      const diff = Math.round(Number(log.difficulty_at_answer));
      if (diff >= 1 && diff <= 10) {
        histogram[diff - 1]++;
      }
      if (index < 10) {
        recentPerformance.unshift(log.correct);
      }
    });
  }

  const accuracy =
    state.total_answers > 0
      ? Math.round((state.correct_answers / state.total_answers) * 100)
      : 0;

  return {
    currentDifficulty: Number(state.current_difficulty),
    streak: state.streak,
    maxStreak: state.max_streak,
    totalScore: Number(state.total_score),
    accuracy,
    totalAnswers: state.total_answers,
    correctAnswers: state.correct_answers,
    momentum: Number(state.momentum),
    recentCorrect: state.recent_correct,
    recentTotal: state.recent_total,
    difficultyHistogram: histogram,
    recentPerformance,
  };
}

/**
 * Get leaderboard rank for a user
 */
async function getLeaderboardRank(
  userId: string,
  type: "score" | "streak",
): Promise<{ userRank: number | null }> {
  const table = type === "score" ? "leaderboard_score" : "leaderboard_streak";
  const orderCol = type === "score" ? "total_score" : "max_streak";

  const { data } = await supabase
    .from(table)
    .select("user_id")
    .order(orderCol, { ascending: false });

  if (!data) return { userRank: null };

  const rank = data.findIndex((e: any) => e.user_id === userId);
  return { userRank: rank >= 0 ? rank + 1 : null };
}
