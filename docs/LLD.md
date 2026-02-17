# BrainBolt - Low Level Design (LLD) Document

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Module Responsibilities](#module-responsibilities)
4. [API Design](#api-design)
5. [Database Schema](#database-schema)
6. [Caching Strategy](#caching-strategy)
7. [Adaptive Algorithm](#adaptive-algorithm)
8. [Score Calculation](#score-calculation)
9. [Leaderboard Update Strategy](#leaderboard-update-strategy)
10. [Edge Cases](#edge-cases)

---

## System Overview

BrainBolt is an adaptive infinite quiz platform that dynamically adjusts question difficulty based on user performance. The system serves one question at a time, tracks user metrics in real-time, and maintains live leaderboards.

### Key Features

- **Adaptive Difficulty**: Questions difficulty adjusts based on performance with ping-pong prevention
- **Streak System**: Consecutive correct answers multiply score earnings
- **Real-time Updates**: All metrics update immediately after each answer
- **Live Leaderboards**: Rankings update in real-time for all users

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React SPA (Vite)                                               │
│  ├── Pages: Index, Leaderboard, Metrics                        │
│  ├── Components: QuizCard, StatsBar, Leaderboard              │
│  ├── Hooks: useAuth, useQuiz, useLeaderboard, useMetrics      │
│  └── Real-time subscriptions via Supabase                      │
├─────────────────────────────────────────────────────────────────┤
│                         API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Express.js REST API                                            │
│  ├── /v1/quiz/next       - Get next question                   │
│  ├── /v1/quiz/answer     - Submit answer (idempotent)          │
│  ├── /v1/quiz/metrics    - Get user metrics                    │
│  ├── /v1/leaderboard/score  - Top scores                       │
│  └── /v1/leaderboard/streak - Top streaks                      │
├─────────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  QuizService                                                    │
│  ├── getNextQuestion()                                          │
│  ├── submitAnswer()                                             │
│  └── getUserMetrics()                                           │
│                                                                 │
│  LeaderboardService                                             │
│  ├── getScoreLeaderboard()                                      │
│  └── getStreakLeaderboard()                                     │
│                                                                 │
│  AdaptiveAlgorithm                                              │
│  ├── processAnswer()                                            │
│  ├── adaptDifficulty()                                          │
│  └── calculateStreakDecay()                                     │
├─────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                          │
│  ├── users, profiles                                            │
│  ├── questions                                                  │
│  ├── user_state                                                 │
│  ├── answer_log                                                 │
│  ├── leaderboard_score                                          │
│  └── leaderboard_streak                                         │
│                                                                 │
│  Redis (Optional Cache)                                         │
│  ├── User state cache                                           │
│  ├── Question pool cache                                        │
│  └── Leaderboard cache                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Responsibilities

### Frontend Modules

| Module           | Responsibility                                                |
| ---------------- | ------------------------------------------------------------- |
| `useAuth`        | Authentication state management (sign in/up/out)              |
| `useQuiz`        | Quiz state management, question fetching, answer submission   |
| `useLeaderboard` | Real-time leaderboard data with Supabase subscriptions        |
| `useMetrics`     | User performance metrics aggregation                          |
| `QuizCard`       | Question display, choice selection, result feedback           |
| `StatsBar`       | Real-time stats display (score, streak, accuracy, difficulty) |
| `Leaderboard`    | Leaderboard panels with user ranking highlight                |
| `ThemeProvider`  | Dark/Light mode management                                    |

### Backend Modules

| Module               | Responsibility                                        |
| -------------------- | ----------------------------------------------------- |
| `quizService`        | Core quiz logic, state management, DB operations      |
| `leaderboardService` | Leaderboard queries with caching                      |
| `adaptive`           | Difficulty algorithm, score calculation, streak decay |
| `redis`              | Cache management with TTL and invalidation            |

---

## API Design

### GET /v1/quiz/next

Get the next question for a user session.

**Request:**

```typescript
{
  userId: string;      // UUID
  sessionId?: string;  // Optional UUID for session tracking
}
```

**Response:**

```typescript
{
  questionId: string;
  difficulty: number;      // 1-10
  prompt: string;
  choices: string[];       // 4 choices
  sessionId: string;
  stateVersion: number;    // For optimistic concurrency
  currentScore: number;
  currentStreak: number;
  maxStreak: number;
  currentDifficulty: number;
}
```

### POST /v1/quiz/answer

Submit an answer with idempotency guarantee.

**Request:**

```typescript
{
  userId: string;
  sessionId: string;
  questionId: string;
  answer: string;
  stateVersion: number; // Must match current version
  answerIdempotencyKey: string; // UUID for duplicate prevention
}
```

**Response:**

```typescript
{
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
```

### GET /v1/quiz/metrics

Get comprehensive user metrics.

**Response:**

```typescript
{
  currentDifficulty: number;
  streak: number;
  maxStreak: number;
  totalScore: number;
  accuracy: number;           // Percentage
  totalAnswers: number;
  correctAnswers: number;
  momentum: number;
  recentCorrect: number;
  recentTotal: number;
  difficultyHistogram: number[];  // Array of 10 values
  recentPerformance: boolean[];   // Last 10 answers
}
```

### GET /v1/leaderboard/score

**Response:**

```typescript
{
  entries: Array<{
    rank: number;
    userId: string;
    username: string;
    value: number;
    isCurrentUser: boolean;
  }>;
  userRank: number | null;
  userValue: number | null;
}
```

---

## Database Schema

### Tables with Indexes

```sql
-- Users profile (created by auth trigger)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)

-- Questions pool (static seed)
questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty INT NOT NULL CHECK (1 <= difficulty <= 10),
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,  -- ["A", "B", "C", "D"]
  correct_answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ
)
INDEX idx_questions_difficulty ON questions(difficulty)

-- User game state
user_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_difficulty NUMERIC(4,2) DEFAULT 3.0,
  streak INT DEFAULT 0,
  max_streak INT DEFAULT 0,
  total_score NUMERIC(12,2) DEFAULT 0,
  total_answers INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  last_question_id UUID REFERENCES questions(id),
  last_answer_at TIMESTAMPTZ,
  state_version INT DEFAULT 1,
  -- Adaptive algorithm fields
  momentum NUMERIC(4,2) DEFAULT 0,
  recent_correct INT DEFAULT 0,
  recent_total INT DEFAULT 0,
  updated_at TIMESTAMPTZ
)

-- Answer history (for analytics and idempotency)
answer_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  question_id UUID REFERENCES questions(id),
  difficulty_at_answer NUMERIC(4,2),
  answer TEXT,
  correct BOOLEAN,
  score_delta NUMERIC(10,2),
  streak_at_answer INT,
  idempotency_key TEXT,
  answered_at TIMESTAMPTZ,
  UNIQUE(user_id, idempotency_key)
)
INDEX idx_answer_log_user ON answer_log(user_id, answered_at DESC)

-- Leaderboards (denormalized for performance)
leaderboard_score (
  user_id UUID PRIMARY KEY,
  username TEXT,
  total_score NUMERIC(12,2),
  updated_at TIMESTAMPTZ
)
INDEX idx_leaderboard_score ON leaderboard_score(total_score DESC)

leaderboard_streak (
  user_id UUID PRIMARY KEY,
  username TEXT,
  max_streak INT,
  updated_at TIMESTAMPTZ
)
INDEX idx_leaderboard_streak ON leaderboard_streak(max_streak DESC)
```

---

## Caching Strategy

### Redis Cache Configuration

| Cache Key                     | TTL  | Invalidation        |
| ----------------------------- | ---- | ------------------- |
| `user:state:{userId}`         | 60s  | On state update     |
| `questions:pool:{difficulty}` | 300s | Never (static data) |
| `leaderboard:score`           | 10s  | On score update     |
| `leaderboard:streak`          | 10s  | On streak update    |

### Cache Flow

```
1. Request arrives for user state
2. Check Redis cache → if hit, return
3. If miss, query PostgreSQL
4. Store in Redis with TTL
5. Return data

On state update:
1. Update PostgreSQL
2. Delete Redis cache key (invalidate)
3. Next request will fetch fresh data
```

### Why These TTLs?

- **User State (60s)**: Balance between freshness and performance. State changes frequently but not every second.
- **Question Pool (300s)**: Questions are static, longer TTL reduces DB load.
- **Leaderboards (10s)**: Short TTL for real-time feel while reducing query load.

---

## Adaptive Algorithm

### Pseudocode

```python
def process_answer(state, is_correct):
    # 1. Update streak
    new_streak = state.streak + 1 if is_correct else 0

    # 2. Calculate score delta
    if is_correct:
        multiplier = min(1 + state.streak * 0.5, 5)  # Cap at 5x
        score_delta = state.difficulty * 10 * multiplier
    else:
        score_delta = 0

    # 3. Update momentum with decay
    impulse = 0.6 if is_correct else -0.8  # Asymmetric
    new_momentum = state.momentum * 0.7 + impulse
    new_momentum = clamp(new_momentum, -3, 3)

    # 4. Update rolling window
    new_recent_total = min(state.recent_total + 1, 10)
    new_recent_correct = update_rolling_correct(state, is_correct)

    # 5. Hysteresis difficulty adjustment
    new_difficulty = state.difficulty

    if new_momentum >= 1.5:  # Positive threshold
        new_difficulty = min(10, state.difficulty + 0.5)
        new_momentum = 0  # Reset after change
    elif new_momentum <= -1.5:  # Negative threshold
        new_difficulty = max(1, state.difficulty - 0.5)
        new_momentum = 0

    # 6. Force adjustment for extreme performance
    if new_recent_total >= 5:
        accuracy = new_recent_correct / new_recent_total
        if accuracy > 0.9:
            new_difficulty = min(10, new_difficulty + 1)
        elif accuracy < 0.2:
            new_difficulty = max(1, new_difficulty - 1)

    return new_state, score_delta
```

### Ping-Pong Prevention

The algorithm prevents rapid oscillation between difficulties through:

1. **Momentum System**: Difficulty changes require accumulated momentum, not single answers.
2. **Hysteresis Band**: Momentum must exceed ±1.5 threshold to trigger change.
3. **Asymmetric Impulse**: Harder to increase (0.6) than decrease (-0.8) difficulty.
4. **Momentum Reset**: After a difficulty change, momentum resets to 0.
5. **Rolling Window**: Extreme patterns (>90% or <20% accuracy) force adjustments.

---

## Score Calculation

```typescript
function calculateScore(difficulty, streak, isCorrect) {
  if (!isCorrect) return 0;

  // Base points scale with difficulty (10-100)
  const basePoints = difficulty * 10;

  // Streak multiplier (1x to 5x, capped)
  const multiplier = Math.min(1 + streak * 0.5, 5);

  // Final score
  return Math.round(basePoints * multiplier * 100) / 100;
}
```

### Score Examples

| Difficulty | Streak     | Multiplier | Score |
| ---------- | ---------- | ---------- | ----- |
| 1          | 0          | 1.0x       | 10    |
| 5          | 0          | 1.0x       | 50    |
| 5          | 2          | 2.0x       | 100   |
| 10         | 8 (capped) | 5.0x       | 500   |

---

## Leaderboard Update Strategy

### Update Flow

```
1. User submits correct answer
2. Calculate new total score
3. Update user_state table
4. Upsert leaderboard_score with new total
5. Invalidate leaderboard cache
6. Query user's new rank
7. Return rank in response
```

### Real-time Updates

Using Supabase Realtime:

```typescript
const channel = supabase
  .channel("leaderboard_changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "leaderboard_score" },
    () => refreshLeaderboard(),
  )
  .subscribe();
```

All connected clients receive updates when any leaderboard entry changes.

---

## Edge Cases

### 1. Streak Reset on Wrong Answer

- **Behavior**: Streak immediately resets to 0
- **Implementation**: `newStreak = correct ? streak + 1 : 0`

### 2. Streak Decay After Inactivity

- **Threshold**: 30 minutes without activity
- **Decay Rate**: 50% per 30-minute period
- **Implementation**:
  ```typescript
  const periods = Math.floor(timeSinceLastAnswer / 30_minutes);
  const decayedStreak = Math.floor(streak * Math.pow(0.5, periods));
  ```

### 3. Duplicate Answer Submission (Idempotency)

- **Detection**: `idempotency_key` column with unique constraint
- **Behavior**: Return cached response, don't update state
- **Implementation**:
  ```sql
  UNIQUE(user_id, idempotency_key)
  ```

### 4. Concurrent State Updates (Race Condition)

- **Detection**: `state_version` column for optimistic locking
- **Behavior**: Reject update if version mismatch
- **Client Action**: Refresh state and retry

### 5. Difficulty Boundary Conditions

- **Minimum**: Difficulty cannot go below 1
- **Maximum**: Difficulty cannot exceed 10
- **Implementation**: `Math.max(1, Math.min(10, newDifficulty))`

### 6. Empty Question Pool

- **Detection**: No questions match target difficulty
- **Fallback**: Expand search range (±1 difficulty), then any question
- **Implementation**: Progressive query widening

### 7. New User Initialization

- **Trigger**: First access with userId
- **Actions**:
  1. Create `user_state` with defaults
  2. Create `leaderboard_score` entry
  3. Create `leaderboard_streak` entry

### 8. Streak Multiplier Cap

- **Maximum**: 5x multiplier (streak ≥ 8)
- **Prevents**: Runaway scoring at high streaks

### 9. Ping-Pong Difficulty Prevention

- **Problem**: User alternates correct/wrong, difficulty oscillates
- **Solution**: Momentum system with hysteresis threshold
- **Requirement**: Need ~3 consecutive same-direction answers to change difficulty

### 10. Rate Limiting

- **Global**: 100 requests/minute per IP
- **Answers**: 30 submissions/minute per IP
- **Implementation**: `express-rate-limit` middleware

---

## Non-Functional Requirements Compliance

| Requirement                | Implementation                                    |
| -------------------------- | ------------------------------------------------- |
| **Strong Consistency**     | PostgreSQL with transactions, optimistic locking  |
| **Idempotent Submit**      | Unique constraint on idempotency_key              |
| **Rate Limiting**          | Express rate-limit middleware                     |
| **Stateless Servers**      | No server-side sessions, all state in DB/Redis    |
| **Real-time Updates**      | Supabase Realtime subscriptions                   |
| **Horizontal Scalability** | Stateless API, Redis cache, DB connection pooling |

---

## File Structure

```
BrainBolt/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and algorithms
│   ├── pages/              # Page components
│   └── integrations/       # External service clients
├── server/                 # Backend source
│   └── src/
│       ├── lib/            # Core libraries
│       ├── routes/         # Express routes
│       ├── services/       # Business logic
│       └── middleware/     # Express middleware
├── supabase/               # Database migrations
├── docker-compose.yml      # Container orchestration
├── Dockerfile              # Frontend container
└── docs/                   # Documentation
```
