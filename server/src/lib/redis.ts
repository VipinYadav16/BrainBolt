import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    // Redis is optional - fallback to direct DB queries
    return null;
  }

  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redis.on("connect", () => {
      console.log("Connected to Redis");
    });
  }

  return redis;
}

// Cache keys
export const CACHE_KEYS = {
  userState: (userId: string) => `user:state:${userId}`,
  questionPool: (difficulty: number) => `questions:pool:${difficulty}`,
  leaderboardScore: "leaderboard:score",
  leaderboardStreak: "leaderboard:streak",
};

// TTL values in seconds
export const CACHE_TTL = {
  userState: 60, // 1 minute
  questionPool: 300, // 5 minutes
  leaderboard: 10, // 10 seconds for real-time feel
};
