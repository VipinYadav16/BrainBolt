import { supabase } from "../lib/supabase.js";
import { getRedis, CACHE_KEYS, CACHE_TTL } from "../lib/redis.js";
import type { LeaderboardResponse, LeaderboardEntry } from "../lib/schemas.js";

/**
 * Get score leaderboard
 */
export async function getScoreLeaderboard(
  userId?: string,
  limit = 50,
): Promise<LeaderboardResponse> {
  const redis = getRedis();
  const cacheKey = CACHE_KEYS.leaderboardScore;

  let entries: LeaderboardEntry[] = [];

  // Try cache first
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      entries = JSON.parse(cached);
    }
  }

  if (entries.length === 0) {
    const { data, error } = await supabase
      .from("leaderboard_score")
      .select("user_id, username, total_score")
      .order("total_score", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return { entries: [], userRank: null, userValue: null };
    }

    entries = data.map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.user_id,
      username: entry.username || "Player",
      value: Number(entry.total_score),
      isCurrentUser: userId ? entry.user_id === userId : false,
    }));

    // Cache the leaderboard
    if (redis) {
      await redis.setex(
        cacheKey,
        CACHE_TTL.leaderboard,
        JSON.stringify(entries),
      );
    }
  }

  // Find user rank and value
  let userRank: number | null = null;
  let userValue: number | null = null;

  if (userId) {
    const userEntry = entries.find((e) => e.userId === userId);
    if (userEntry) {
      userRank = userEntry.rank;
      userValue = userEntry.value;
    } else {
      // User not in top N, get their rank
      const { data } = await supabase
        .from("leaderboard_score")
        .select("user_id, total_score")
        .order("total_score", { ascending: false });

      if (data) {
        const rank = data.findIndex((e: any) => e.user_id === userId);
        if (rank >= 0) {
          userRank = rank + 1;
          userValue = Number((data[rank] as any).total_score);
        }
      }
    }

    // Mark current user in entries
    entries = entries.map((e) => ({
      ...e,
      isCurrentUser: e.userId === userId,
    }));
  }

  return { entries, userRank, userValue };
}

/**
 * Get streak leaderboard
 */
export async function getStreakLeaderboard(
  userId?: string,
  limit = 50,
): Promise<LeaderboardResponse> {
  const redis = getRedis();
  const cacheKey = CACHE_KEYS.leaderboardStreak;

  let entries: LeaderboardEntry[] = [];

  // Try cache first
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      entries = JSON.parse(cached);
    }
  }

  if (entries.length === 0) {
    const { data, error } = await supabase
      .from("leaderboard_streak")
      .select("user_id, username, max_streak")
      .order("max_streak", { ascending: false })
      .limit(limit);

    if (error || !data) {
      return { entries: [], userRank: null, userValue: null };
    }

    entries = data.map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.user_id,
      username: entry.username || "Player",
      value: entry.max_streak,
      isCurrentUser: userId ? entry.user_id === userId : false,
    }));

    // Cache the leaderboard
    if (redis) {
      await redis.setex(
        cacheKey,
        CACHE_TTL.leaderboard,
        JSON.stringify(entries),
      );
    }
  }

  // Find user rank and value
  let userRank: number | null = null;
  let userValue: number | null = null;

  if (userId) {
    const userEntry = entries.find((e) => e.userId === userId);
    if (userEntry) {
      userRank = userEntry.rank;
      userValue = userEntry.value;
    } else {
      // User not in top N, get their rank
      const { data } = await supabase
        .from("leaderboard_streak")
        .select("user_id, max_streak")
        .order("max_streak", { ascending: false });

      if (data) {
        const rank = data.findIndex((e: any) => e.user_id === userId);
        if (rank >= 0) {
          userRank = rank + 1;
          userValue = (data[rank] as any).max_streak;
        }
      }
    }

    // Mark current user in entries
    entries = entries.map((e) => ({
      ...e,
      isCurrentUser: e.userId === userId,
    }));
  }

  return { entries, userRank, userValue };
}

/**
 * Invalidate leaderboard cache
 */
export async function invalidateLeaderboardCache(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(CACHE_KEYS.leaderboardScore);
    await redis.del(CACHE_KEYS.leaderboardStreak);
  }
}
