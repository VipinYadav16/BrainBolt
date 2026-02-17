import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { LeaderboardEntry } from "@/lib/types";

export function useLeaderboard(
  type: "score" | "streak",
  userId?: string | null,
) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userValue, setUserValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    const table = type === "score" ? "leaderboard_score" : "leaderboard_streak";
    const orderCol = type === "score" ? "total_score" : "max_streak";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderCol, { ascending: false })
      .limit(50);

    if (error) {
      console.error("Leaderboard error:", error);
      setLoading(false);
      return;
    }

    setEntries((data || []) as unknown as LeaderboardEntry[]);

    if (userId && data) {
      const rank = data.findIndex((e: any) => e.user_id === userId);
      if (rank >= 0) {
        setUserRank(rank + 1);
        const entry = data[rank] as any;
        setUserValue(
          type === "score" ? Number(entry.total_score) : entry.max_streak,
        );
      } else {
        setUserRank(null);
        setUserValue(null);
      }
    }
    setLoading(false);
  }, [type, userId]);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime changes
    const table = type === "score" ? "leaderboard_score" : "leaderboard_streak";
    const channel = supabase
      .channel(`${table}_changes_${userId || "anon"}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, userId, fetchLeaderboard]);

  return { entries, userRank, userValue, loading, refresh: fetchLeaderboard };
}
