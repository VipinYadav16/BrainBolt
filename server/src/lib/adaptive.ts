/**
 * BrainBolt Adaptive Quiz Algorithm
 *
 * Features:
 * - Hysteresis-based difficulty adjustment to prevent ping-pong
 * - Momentum system for smooth transitions
 * - Rolling window for recent performance
 * - Streak decay for inactivity
 * - Capped streak multiplier
 */

export interface UserState {
  current_difficulty: number;
  streak: number;
  max_streak: number;
  total_score: number;
  total_answers: number;
  correct_answers: number;
  momentum: number;
  recent_correct: number;
  recent_total: number;
  state_version: number;
  last_answer_at: string | null;
}

// Configuration constants
const CONFIG = {
  MIN_DIFFICULTY: 1,
  MAX_DIFFICULTY: 10,
  MAX_STREAK_MULTIPLIER: 5,
  MOMENTUM_DECAY: 0.7,
  MOMENTUM_THRESHOLD: 1.5, // Hysteresis band
  RECENT_WINDOW: 10,
  STREAK_DECAY_THRESHOLD_MS: 30 * 60 * 1000, // 30 minutes
  STREAK_DECAY_RATE: 0.5,
  BASE_POINTS_PER_DIFFICULTY: 10,
};

/**
 * Calculate streak multiplier (capped)
 */
export function getStreakMultiplier(streak: number): number {
  return Math.min(1 + streak * 0.5, CONFIG.MAX_STREAK_MULTIPLIER);
}

/**
 * Calculate score delta for an answer
 */
export function calculateScoreDelta(
  difficulty: number,
  streak: number,
  correct: boolean,
): number {
  if (!correct) return 0;
  const difficultyWeight = difficulty * CONFIG.BASE_POINTS_PER_DIFFICULTY;
  const multiplier = getStreakMultiplier(streak);
  return Math.round(difficultyWeight * multiplier * 100) / 100;
}

/**
 * Calculate streak decay based on inactivity
 */
export function calculateStreakDecay(
  currentStreak: number,
  lastAnswerAt: string | null,
): { decayedStreak: number; decayApplied: boolean } {
  if (!lastAnswerAt || currentStreak === 0) {
    return { decayedStreak: currentStreak, decayApplied: false };
  }

  const lastAnswerTime = new Date(lastAnswerAt).getTime();
  const now = Date.now();
  const timeSinceLastAnswer = now - lastAnswerTime;

  if (timeSinceLastAnswer < CONFIG.STREAK_DECAY_THRESHOLD_MS) {
    return { decayedStreak: currentStreak, decayApplied: false };
  }

  const decayPeriods = Math.floor(
    timeSinceLastAnswer / CONFIG.STREAK_DECAY_THRESHOLD_MS,
  );
  const decayFactor = Math.pow(1 - CONFIG.STREAK_DECAY_RATE, decayPeriods);
  const decayedStreak = Math.floor(currentStreak * decayFactor);

  return { decayedStreak, decayApplied: decayedStreak !== currentStreak };
}

/**
 * Adaptive difficulty adjustment with hysteresis stabilization
 *
 * Prevents ping-pong instability by:
 * 1. Using momentum system that accumulates over multiple answers
 * 2. Only changing difficulty when momentum exceeds threshold (hysteresis)
 * 3. Rolling window for recent performance analysis
 * 4. Forced adjustment for extreme accuracy patterns
 */
export function adaptDifficulty(
  state: UserState,
  correct: boolean,
): {
  newDifficulty: number;
  newMomentum: number;
  newRecentCorrect: number;
  newRecentTotal: number;
} {
  // Update rolling window
  const newRecentTotal = Math.min(state.recent_total + 1, CONFIG.RECENT_WINDOW);
  let newRecentCorrect = state.recent_correct;

  if (state.recent_total >= CONFIG.RECENT_WINDOW) {
    // Decay old answers out of window
    const decayRatio = (CONFIG.RECENT_WINDOW - 1) / CONFIG.RECENT_WINDOW;
    newRecentCorrect =
      Math.round(state.recent_correct * decayRatio * 100) / 100;
  }
  newRecentCorrect = correct ? newRecentCorrect + 1 : newRecentCorrect;

  // Calculate momentum with decay
  // Asymmetric: harder to increase than decrease difficulty
  const impulse = correct ? 0.6 : -0.8;
  let newMomentum = state.momentum * CONFIG.MOMENTUM_DECAY + impulse;
  newMomentum = Math.max(-3, Math.min(3, newMomentum));
  newMomentum = Math.round(newMomentum * 100) / 100;

  let newDifficulty = state.current_difficulty;

  // Hysteresis band: only change when momentum exceeds threshold
  if (newMomentum >= CONFIG.MOMENTUM_THRESHOLD) {
    newDifficulty = Math.min(
      CONFIG.MAX_DIFFICULTY,
      Math.round((state.current_difficulty + 0.5) * 100) / 100,
    );
    newMomentum = 0; // Reset after change
  } else if (newMomentum <= -CONFIG.MOMENTUM_THRESHOLD) {
    newDifficulty = Math.max(
      CONFIG.MIN_DIFFICULTY,
      Math.round((state.current_difficulty - 0.5) * 100) / 100,
    );
    newMomentum = 0;
  }

  // Force adjustment for extreme recent accuracy
  if (newRecentTotal >= 5) {
    const recentAccuracy = newRecentCorrect / newRecentTotal;
    if (recentAccuracy > 0.9 && newDifficulty < CONFIG.MAX_DIFFICULTY) {
      newDifficulty = Math.min(CONFIG.MAX_DIFFICULTY, newDifficulty + 1);
      newMomentum = 0;
    } else if (recentAccuracy < 0.2 && newDifficulty > CONFIG.MIN_DIFFICULTY) {
      newDifficulty = Math.max(CONFIG.MIN_DIFFICULTY, newDifficulty - 1);
      newMomentum = 0;
    }
  }

  return { newDifficulty, newMomentum, newRecentCorrect, newRecentTotal };
}

/**
 * Process an answer and return the new state
 */
export function processAnswer(
  state: UserState,
  correct: boolean,
): {
  newState: Partial<UserState>;
  scoreDelta: number;
} {
  const newStreak = correct ? state.streak + 1 : 0;
  const scoreDelta = calculateScoreDelta(
    state.current_difficulty,
    state.streak,
    correct,
  );
  const { newDifficulty, newMomentum, newRecentCorrect, newRecentTotal } =
    adaptDifficulty(state, correct);

  return {
    newState: {
      current_difficulty: newDifficulty,
      streak: newStreak,
      max_streak: Math.max(state.max_streak, newStreak),
      total_score: Math.round((state.total_score + scoreDelta) * 100) / 100,
      total_answers: state.total_answers + 1,
      correct_answers: state.correct_answers + (correct ? 1 : 0),
      momentum: newMomentum,
      recent_correct: newRecentCorrect,
      recent_total: newRecentTotal,
      state_version: state.state_version + 1,
    },
    scoreDelta,
  };
}
