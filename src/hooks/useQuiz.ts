import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  processAnswer,
  getStreakMultiplier,
  calculateStreakDecay,
} from "@/lib/adaptive";
import type { Question, UserStateRow } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

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

export function useQuiz(userId: string | null) {
  const [userState, setUserState] = useState<UserStateRow | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [lastResult, setLastResult] = useState<{
    correct: boolean;
    scoreDelta: number;
    correctAnswer: string;
    streakDecayed?: boolean;
  } | null>(null);

  // Load or create user state with streak decay check
  useEffect(() => {
    if (!userId) return;

    const loadState = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_state")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading state:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        // Create initial state
        const newState = { ...DEFAULT_STATE, user_id: userId };
        const { data: created, error: createErr } = await supabase
          .from("user_state")
          .insert(newState)
          .select()
          .single();

        if (createErr) console.error("Error creating state:", createErr);
        setUserState(created as unknown as UserStateRow);

        // Also create leaderboard entries
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", userId)
          .single();
        const username = (profileData as any)?.username || "Player";
        await supabase
          .from("leaderboard_score")
          .insert({ user_id: userId, username, total_score: 0 });
        await supabase
          .from("leaderboard_streak")
          .insert({ user_id: userId, username, max_streak: 0 });
      } else {
        const state = data as any;

        // Check for streak decay due to inactivity
        const { decayedStreak, decayApplied } = calculateStreakDecay(
          state.streak,
          state.last_answer_at,
        );

        if (decayApplied && decayedStreak !== state.streak) {
          // Update the state with decayed streak
          const updatedState = {
            ...state,
            streak: decayedStreak,
            state_version: state.state_version + 1,
            updated_at: new Date().toISOString(),
          };

          await supabase
            .from("user_state")
            .update({
              streak: decayedStreak,
              state_version: state.state_version + 1,
            })
            .eq("user_id", userId);

          setUserState(updatedState as UserStateRow);

          // Show decay notification
          setLastResult({
            correct: false,
            scoreDelta: 0,
            correctAnswer: "",
            streakDecayed: true,
          });
        } else {
          setUserState(state as UserStateRow);
        }
      }
      setLoading(false);
    };

    loadState();
  }, [userId]);

  // Fetch next question based on difficulty
  const fetchQuestion = useCallback(
    async (difficulty: number, excludeId?: string | null) => {
      const roundedDiff = Math.round(difficulty);
      // Get questions at target difficulty, falling back to nearby difficulties
      let query = supabase
        .from("questions")
        .select("*")
        .gte("difficulty", Math.max(1, roundedDiff - 1))
        .lte("difficulty", Math.min(10, roundedDiff + 1));

      if (excludeId) {
        query = query.neq("id", excludeId);
      }

      const { data, error } = await query;

      if (error || !data?.length) {
        // Fallback: any question
        const { data: fallback } = await supabase
          .from("questions")
          .select("*")
          .limit(10);
        if (fallback?.length) {
          const q = fallback[Math.floor(Math.random() * fallback.length)];
          setCurrentQuestion({
            ...q,
            choices: q.choices as unknown as string[],
          } as Question);
        }
        return;
      }

      // Prefer exact difficulty match
      const exact = data.filter((q) => q.difficulty === roundedDiff);
      const pool = exact.length > 0 ? exact : data;
      const q = pool[Math.floor(Math.random() * pool.length)];
      setCurrentQuestion({
        ...q,
        choices: q.choices as unknown as string[],
      } as Question);
    },
    [],
  );

  // Load first question when state is ready
  useEffect(() => {
    if (userState && !currentQuestion && !loading) {
      fetchQuestion(userState.current_difficulty, userState.last_question_id);
    }
  }, [userState, currentQuestion, loading, fetchQuestion]);

  // Submit answer
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!userState || !currentQuestion || !userId || answering) return;

      setAnswering(true);
      const correct = answer === currentQuestion.correct_answer;

      const { newState, scoreDelta } = processAnswer(
        {
          current_difficulty: Number(userState.current_difficulty),
          streak: userState.streak,
          max_streak: userState.max_streak,
          total_score: Number(userState.total_score),
          total_answers: userState.total_answers,
          correct_answers: userState.correct_answers,
          momentum: Number(userState.momentum),
          recent_correct: userState.recent_correct,
          recent_total: userState.recent_total,
          state_version: userState.state_version,
        },
        correct,
      );

      const idempotencyKey = uuidv4();

      // Log the answer
      await supabase.from("answer_log").insert({
        user_id: userId,
        question_id: currentQuestion.id,
        difficulty_at_answer: Number(userState.current_difficulty),
        answer,
        correct,
        score_delta: scoreDelta,
        streak_at_answer: userState.streak,
        idempotency_key: idempotencyKey,
      });

      // Update user state
      const updatedState = {
        ...newState,
        last_question_id: currentQuestion.id,
        last_answer_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from("user_state")
        .update(updatedState)
        .eq("user_id", userId)
        .eq("state_version", userState.state_version); // Optimistic concurrency

      // Update leaderboards
      await supabase
        .from("leaderboard_score")
        .update({
          total_score: newState.total_score!,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      await supabase
        .from("leaderboard_streak")
        .update({
          max_streak: newState.max_streak!,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      setLastResult({
        correct,
        scoreDelta,
        correctAnswer: currentQuestion.correct_answer,
      });
      setUserState((prev) =>
        prev ? ({ ...prev, ...updatedState } as UserStateRow) : null,
      );
      setAnswering(false);
    },
    [userState, currentQuestion, userId, answering],
  );

  const nextQuestion = useCallback(() => {
    if (!userState) return;
    setLastResult(null);
    setCurrentQuestion(null);
    fetchQuestion(
      Number(userState.current_difficulty),
      userState.last_question_id,
    );
  }, [userState, fetchQuestion]);

  return {
    userState,
    currentQuestion,
    loading,
    answering,
    lastResult,
    submitAnswer,
    nextQuestion,
    streakMultiplier: userState ? getStreakMultiplier(userState.streak) : 1,
  };
}
