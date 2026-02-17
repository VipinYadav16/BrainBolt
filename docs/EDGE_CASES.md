# BrainBolt Edge Cases & Handling

This document details all edge cases handled by the BrainBolt adaptive quiz platform.

## 1. Adaptive Algorithm Edge Cases

### 1.1 Ping-Pong Instability Prevention

**Problem**: When a user alternates between correct and wrong answers, difficulty could rapidly oscillate between two values (e.g., 5 → 6 → 5 → 6...).

**Solution**: Hysteresis-based momentum system

```typescript
// Momentum accumulates over multiple answers
const MOMENTUM_THRESHOLD = 1.5; // Must accumulate this much to change
const MOMENTUM_DECAY = 0.7; // Previous momentum decays each answer

// Single answer impulses
const impulse = correct ? 0.6 : -0.8; // Asymmetric: harder to go up

// Momentum only triggers change when exceeding threshold
if (momentum >= MOMENTUM_THRESHOLD) {
  difficulty += 0.5;
  momentum = 0; // Reset after change
}
```

**Result**: User must answer ~3 consecutive correct answers to increase difficulty, preventing rapid oscillation.

### 1.2 Boundary Conditions

**Problem**: Difficulty could go below 1 or above 10.

**Solution**: Clamping at boundaries

```typescript
newDifficulty = Math.max(1, Math.min(10, calculatedDifficulty));
```

### 1.3 Extreme Performance Override

**Problem**: User stuck at wrong difficulty despite consistent performance.

**Solution**: Rolling window forces adjustment

```typescript
if (recentTotal >= 5) {
  const accuracy = recentCorrect / recentTotal;
  if (accuracy > 0.9) {
    // Getting >90% right → force increase
    newDifficulty = Math.min(10, difficulty + 1);
  } else if (accuracy < 0.2) {
    // Getting <20% right → force decrease
    newDifficulty = Math.max(1, difficulty - 1);
  }
}
```

---

## 2. Streak System Edge Cases

### 2.1 Streak Reset on Wrong Answer

**Behavior**: Streak immediately resets to 0 on any incorrect answer.

```typescript
const newStreak = correct ? streak + 1 : 0;
```

### 2.2 Streak Decay After Inactivity

**Problem**: Users could maintain high streaks indefinitely by not playing.

**Solution**: Time-based streak decay

```typescript
const DECAY_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const DECAY_RATE = 0.5; // Lose 50% per period

function calculateStreakDecay(streak, lastAnswerAt) {
  const elapsed = Date.now() - new Date(lastAnswerAt).getTime();

  if (elapsed < DECAY_THRESHOLD) {
    return streak; // No decay
  }

  const periods = Math.floor(elapsed / DECAY_THRESHOLD);
  return Math.floor(streak * Math.pow(1 - DECAY_RATE, periods));
}
```

**Example**:

- 30 min inactive: streak 10 → 5
- 60 min inactive: streak 10 → 2
- 90 min inactive: streak 10 → 1

### 2.3 Streak Multiplier Cap

**Problem**: Unbounded multiplier could create runaway scoring.

**Solution**: Cap at 5x

```typescript
const MAX_MULTIPLIER = 5;
const multiplier = Math.min(1 + streak * 0.5, MAX_MULTIPLIER);
```

**Multiplier Table**:
| Streak | Multiplier |
|--------|------------|
| 0 | 1.0x |
| 1 | 1.5x |
| 2 | 2.0x |
| 3 | 2.5x |
| 4 | 3.0x |
| 5 | 3.5x |
| 6 | 4.0x |
| 7 | 4.5x |
| 8+ | 5.0x (capped) |

---

## 3. Data Consistency Edge Cases

### 3.1 Duplicate Answer Submission (Idempotency)

**Problem**: Network issues could cause client to submit same answer twice.

**Solution**: Idempotency key with unique constraint

```sql
-- Database schema
answer_log (
  ...
  idempotency_key TEXT NOT NULL,
  UNIQUE(user_id, idempotency_key)
)
```

```typescript
// Server handling
async function submitAnswer(userId, questionId, answer, idempotencyKey) {
  // Check for existing submission
  const existing = await db.query(
    'SELECT * FROM answer_log WHERE user_id = $1 AND idempotency_key = $2',
    [userId, idempotencyKey]
  );

  if (existing) {
    // Return cached response - no state change
    return getCachedResponse(existing);
  }

  // Process new submission
  ...
}
```

**Client Behavior**: Generate UUID for each answer attempt, reuse same key on retry.

### 3.2 Concurrent State Updates (Race Condition)

**Problem**: Two requests try to update user state simultaneously.

**Solution**: Optimistic locking with state version

```typescript
// Client sends current version with request
const response = await api.submitAnswer({
  ...
  stateVersion: currentState.state_version
});

// Server verifies version before update
const result = await db.query(
  `UPDATE user_state
   SET ..., state_version = state_version + 1
   WHERE user_id = $1 AND state_version = $2`, // Version must match
  [userId, stateVersion]
);

if (result.rowCount === 0) {
  throw new Error('State version conflict');
}
```

**Client Recovery**: On version conflict, refresh state and retry.

### 3.3 Session Expiry During Quiz

**Problem**: User's authentication token expires mid-quiz.

**Solution**: Graceful token refresh

```typescript
// Supabase client handles automatic refresh
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

---

## 4. Question Pool Edge Cases

### 4.1 No Questions at Target Difficulty

**Problem**: Question pool may not have questions for every difficulty.

**Solution**: Progressive fallback

```typescript
async function getQuestion(targetDifficulty) {
  // Try exact match first
  let questions = await db.query(
    "SELECT * FROM questions WHERE difficulty = $1",
    [Math.round(targetDifficulty)],
  );

  if (questions.length === 0) {
    // Expand to adjacent difficulties
    questions = await db.query(
      "SELECT * FROM questions WHERE difficulty BETWEEN $1 AND $2",
      [Math.max(1, targetDifficulty - 1), Math.min(10, targetDifficulty + 1)],
    );
  }

  if (questions.length === 0) {
    // Final fallback: any question
    questions = await db.query("SELECT * FROM questions LIMIT 10");
  }

  return randomSelect(questions);
}
```

### 4.2 Same Question Repeatedly

**Problem**: User could get same question twice in a row.

**Solution**: Exclude last answered question

```typescript
const available = questionPool.filter((q) => q.id !== lastQuestionId);
const finalPool = available.length > 0 ? available : questionPool;
```

### 4.3 Empty Question Database

**Problem**: No questions seeded in database.

**Solution**: Return clear error

```typescript
if (questionPool.length === 0) {
  throw new Error("No questions available. Please contact administrator.");
}
```

---

## 5. User State Edge Cases

### 5.1 New User Initialization

**Problem**: User doesn't have state record on first visit.

**Solution**: Automatic initialization

```typescript
async function getUserState(userId) {
  const state = await db.query('SELECT * FROM user_state WHERE user_id = $1', [userId]);

  if (!state) {
    // Create default state
    const newState = {
      user_id: userId,
      current_difficulty: 3.0,  // Start medium
      streak: 0,
      max_streak: 0,
      total_score: 0,
      momentum: 0,
      state_version: 1,
      ...
    };

    await db.insert('user_state', newState);

    // Also create leaderboard entries
    await db.insert('leaderboard_score', { user_id: userId, total_score: 0 });
    await db.insert('leaderboard_streak', { user_id: userId, max_streak: 0 });

    return newState;
  }

  return state;
}
```

### 5.2 Account Deletion

**Problem**: User deletes account but has records in other tables.

**Solution**: Cascading deletes via foreign keys

```sql
CREATE TABLE user_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
```

---

## 6. Leaderboard Edge Cases

### 6.1 Ties in Ranking

**Problem**: Multiple users have same score.

**Solution**: Order by score, then by most recent update

```sql
SELECT * FROM leaderboard_score
ORDER BY total_score DESC, updated_at DESC
LIMIT 50;
```

### 6.2 User Not in Top N

**Problem**: Current user might not appear in visible leaderboard.

**Solution**: Separate query for user's rank

```typescript
const leaderboard = await getTopN(50);
let userRank = leaderboard.findIndex((e) => e.userId === userId) + 1;

if (userRank === 0) {
  // User not in top 50, get actual rank
  const allUsers = await db.query(
    "SELECT user_id FROM leaderboard_score ORDER BY total_score DESC",
  );
  userRank = allUsers.findIndex((e) => e.user_id === userId) + 1;
}

return { leaderboard, userRank };
```

### 6.3 Real-time Update Failures

**Problem**: Supabase Realtime connection drops.

**Solution**: Automatic reconnection with polling fallback

```typescript
const channel = supabase
  .channel('leaderboard')
  .on('postgres_changes', { ... }, refresh)
  .subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      // Fallback to polling
      setInterval(refresh, 10000);
    }
  });
```

---

## 7. Security Edge Cases

### 7.1 Rate Limiting

**Problem**: Client could flood server with requests.

**Solution**: Multi-tier rate limiting

```typescript
// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests
});

// Stricter limit for answer submissions
const answerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 answers/minute max
});

app.use(generalLimiter);
app.use("/v1/quiz/answer", answerLimiter);
```

### 7.2 Invalid Question ID

**Problem**: Client sends non-existent question ID.

**Solution**: Validate before processing

```typescript
const question = await db.query("SELECT * FROM questions WHERE id = $1", [
  questionId,
]);

if (!question) {
  return res.status(400).json({ error: "Invalid question ID" });
}
```

### 7.3 Answer Tampering

**Problem**: Client could send answers for questions they haven't seen.

**Solution**:

1. Log all served questions
2. Verify question was served to user
3. `last_question_id` in user_state provides additional validation

---

## 8. Network Edge Cases

### 8.1 Offline During Answer

**Problem**: User submits answer while offline.

**Solution**: Client-side queue with retry

```typescript
// React Query handles this automatically with proper config
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### 8.2 Slow Network Response

**Problem**: User clicks multiple times waiting for response.

**Solution**: Disable UI during submission + idempotency

```tsx
<button
  onClick={handleAnswer}
  disabled={isSubmitting} // Prevent double clicks
>
  {isSubmitting ? "Submitting..." : choice}
</button>
```

---

## Summary: Edge Case Handling Matrix

| Edge Case            | Detection              | Handling             | Recovery             |
| -------------------- | ---------------------- | -------------------- | -------------------- |
| Ping-pong difficulty | Momentum tracking      | Hysteresis threshold | Automatic            |
| Duplicate submission | Idempotency key        | Return cached result | Transparent          |
| Version conflict     | State version check    | Reject update        | Client refresh       |
| Streak decay         | Time since last answer | Apply decay formula  | Display notification |
| Empty question pool  | Count check            | Progressive fallback | Error message        |
| Rate limit exceeded  | Request counting       | HTTP 429 response    | Wait and retry       |
| Auth token expired   | Supabase error         | Auto refresh token   | Seamless             |
| Network failure      | Request timeout        | Retry with backoff   | User notification    |
