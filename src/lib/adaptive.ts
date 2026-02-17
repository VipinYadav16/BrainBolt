// Adaptive quiz algorithm with hysteresis-based stabilization

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
}

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MAX_STREAK_MULTIPLIER = 5;
const MOMENTUM_DECAY = 0.7; // Decay factor for momentum
const MOMENTUM_THRESHOLD = 1.5; // Hysteresis: need accumulated momentum to change difficulty
const RECENT_WINDOW = 10; // Rolling window size
const STREAK_DECAY_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes inactivity
const STREAK_DECAY_RATE = 0.5; // Lose 50% of streak per decay period

/**
 * Calculate streak multiplier (capped at MAX_STREAK_MULTIPLIER)
 */
export function getStreakMultiplier(streak: number): number {
  // 1x base, +0.5x per streak level, capped
  return Math.min(1 + streak * 0.5, MAX_STREAK_MULTIPLIER);
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
  const difficultyWeight = difficulty * 10; // 10-100 points based on difficulty
  const multiplier = getStreakMultiplier(streak);
  return Math.round(difficultyWeight * multiplier * 100) / 100;
}

/**
 * Calculate streak decay based on inactivity
 * Returns the decayed streak value
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

  if (timeSinceLastAnswer < STREAK_DECAY_THRESHOLD_MS) {
    return { decayedStreak: currentStreak, decayApplied: false };
  }

  // Calculate how many decay periods have passed
  const decayPeriods = Math.floor(
    timeSinceLastAnswer / STREAK_DECAY_THRESHOLD_MS,
  );

  // Apply exponential decay: streak * (1 - DECAY_RATE)^periods
  const decayFactor = Math.pow(1 - STREAK_DECAY_RATE, decayPeriods);
  const decayedStreak = Math.floor(currentStreak * decayFactor);

  return { decayedStreak, decayApplied: decayedStreak !== currentStreak };
}

/**
 * Adaptive difficulty adjustment with hysteresis stabilization.
 * Uses momentum system to prevent ping-pong instability.
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
  const newRecentTotal = Math.min(state.recent_total + 1, RECENT_WINDOW);
  let newRecentCorrect = state.recent_correct;

  if (state.recent_total >= RECENT_WINDOW) {
    // Approximate: decay old answers out of window
    const decayRatio = (RECENT_WINDOW - 1) / RECENT_WINDOW;
    newRecentCorrect =
      Math.round(state.recent_correct * decayRatio * 100) / 100;
  }
  newRecentCorrect = correct ? newRecentCorrect + 1 : newRecentCorrect;

  // Calculate momentum with decay
  // Correct answers add positive momentum, wrong answers add negative
  const impulse = correct ? 0.6 : -0.8; // Slightly asymmetric: harder to go up
  let newMomentum = state.momentum * MOMENTUM_DECAY + impulse;

  // Clamp momentum
  newMomentum = Math.max(-3, Math.min(3, newMomentum));
  newMomentum = Math.round(newMomentum * 100) / 100;

  // Only change difficulty when momentum exceeds threshold (hysteresis band)
  let newDifficulty = state.current_difficulty;

  if (newMomentum >= MOMENTUM_THRESHOLD) {
    // Sufficient positive momentum: increase difficulty
    newDifficulty = Math.min(
      MAX_DIFFICULTY,
      Math.round((state.current_difficulty + 0.5) * 100) / 100,
    );
    newMomentum = 0; // Reset momentum after change
  } else if (newMomentum <= -MOMENTUM_THRESHOLD) {
    // Sufficient negative momentum: decrease difficulty
    newDifficulty = Math.max(
      MIN_DIFFICULTY,
      Math.round((state.current_difficulty - 0.5) * 100) / 100,
    );
    newMomentum = 0; // Reset momentum after change
  }

  // Additional stabilizer: if recent accuracy is extreme, force adjustment
  if (newRecentTotal >= 5) {
    const recentAccuracy = newRecentCorrect / newRecentTotal;
    if (recentAccuracy > 0.9 && newDifficulty < MAX_DIFFICULTY) {
      newDifficulty = Math.min(MAX_DIFFICULTY, newDifficulty + 1);
      newMomentum = 0;
    } else if (recentAccuracy < 0.2 && newDifficulty > MIN_DIFFICULTY) {
      newDifficulty = Math.max(MIN_DIFFICULTY, newDifficulty - 1);
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
