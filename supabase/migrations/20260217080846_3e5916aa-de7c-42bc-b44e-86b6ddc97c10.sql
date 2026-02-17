
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Questions table (public read, static seed)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  difficulty INT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 10),
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL, -- ["A", "B", "C", "D"]
  correct_answer TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON public.questions FOR SELECT USING (true);

-- User state table
CREATE TABLE public.user_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_difficulty NUMERIC(4,2) NOT NULL DEFAULT 3.0,
  streak INT NOT NULL DEFAULT 0,
  max_streak INT NOT NULL DEFAULT 0,
  total_score NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_answers INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  last_question_id UUID REFERENCES public.questions(id),
  last_answer_at TIMESTAMPTZ,
  state_version INT NOT NULL DEFAULT 1,
  -- Adaptive algorithm fields
  momentum NUMERIC(4,2) NOT NULL DEFAULT 0, -- rolling momentum for hysteresis
  recent_correct INT NOT NULL DEFAULT 0, -- correct in last N window
  recent_total INT NOT NULL DEFAULT 0, -- total in last N window
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own state" ON public.user_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own state" ON public.user_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own state" ON public.user_state FOR UPDATE USING (auth.uid() = user_id);

-- Answer log
CREATE TABLE public.answer_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  difficulty_at_answer NUMERIC(4,2) NOT NULL,
  answer TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  score_delta NUMERIC(10,2) NOT NULL DEFAULT 0,
  streak_at_answer INT NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);

ALTER TABLE public.answer_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own answers" ON public.answer_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.answer_log FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_answer_log_user ON public.answer_log(user_id, answered_at DESC);

-- Leaderboard score
CREATE TABLE public.leaderboard_score (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT '',
  total_score NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_score ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read leaderboard_score" ON public.leaderboard_score FOR SELECT USING (true);
CREATE POLICY "Users can insert own leaderboard_score" ON public.leaderboard_score FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard_score" ON public.leaderboard_score FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard streak
CREATE TABLE public.leaderboard_streak (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT '',
  max_streak INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read leaderboard_streak" ON public.leaderboard_streak FOR SELECT USING (true);
CREATE POLICY "Users can insert own leaderboard_streak" ON public.leaderboard_streak FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leaderboard_streak" ON public.leaderboard_streak FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for leaderboards
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_score;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_streak;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_state;

-- Indexes
CREATE INDEX idx_leaderboard_score ON public.leaderboard_score(total_score DESC);
CREATE INDEX idx_leaderboard_streak ON public.leaderboard_streak(max_streak DESC);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
