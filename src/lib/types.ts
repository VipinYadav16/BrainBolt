export interface Question {
  id: string;
  difficulty: number;
  prompt: string;
  choices: string[];
  correct_answer: string;
  category: string;
}

export interface UserStateRow {
  user_id: string;
  current_difficulty: number;
  streak: number;
  max_streak: number;
  total_score: number;
  total_answers: number;
  correct_answers: number;
  last_question_id: string | null;
  last_answer_at: string | null;
  state_version: number;
  momentum: number;
  recent_correct: number;
  recent_total: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score?: number;
  max_streak?: number;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}
