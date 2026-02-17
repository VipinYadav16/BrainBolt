import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserMetrics {
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
  stateVersion: number;
  lastAnswerAt: string | null;
  difficultyHistogram: number[];
  recentPerformance: boolean[];
}

export function useMetrics(userId: string | null) {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);

      // Get user state
      const { data: stateData } = await supabase
        .from("user_state")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!stateData) {
        setLoading(false);
        return;
      }

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

      const state = stateData as any;
      const accuracy =
        state.total_answers > 0
          ? Math.round((state.correct_answers / state.total_answers) * 100)
          : 0;

      setMetrics({
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
        stateVersion: state.state_version,
        lastAnswerAt: state.last_answer_at,
        difficultyHistogram: histogram,
        recentPerformance,
      });
      setLoading(false);
    };

    fetchMetrics();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_state_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_state",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchMetrics();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { metrics, loading };
}
