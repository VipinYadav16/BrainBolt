import type { UserStateRow } from "@/lib/types";
import { getStreakMultiplier } from "@/lib/adaptive";
import { Flame, Target, TrendingUp, Zap, Trophy } from "lucide-react";

interface StatsBarProps {
  state: UserStateRow;
  scoreRank?: number | null;
  streakRank?: number | null;
}

export function StatsBar({ state, scoreRank, streakRank }: StatsBarProps) {
  const accuracy =
    state.total_answers > 0
      ? Math.round((state.correct_answers / state.total_answers) * 100)
      : 0;
  const multiplier = getStreakMultiplier(state.streak);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatItem
          icon={<Zap className="h-4 w-4 text-primary" />}
          label="Score"
          value={Number(state.total_score).toLocaleString()}
          sub={scoreRank ? `Rank #${scoreRank}` : undefined}
          glow="primary"
        />
        <StatItem
          icon={<Flame className="h-4 w-4 text-accent" />}
          label="Streak"
          value={`${state.streak} 🔥`}
          sub={`${multiplier}x multiplier`}
          glow="accent"
        />
        <StatItem
          icon={<Target className="h-4 w-4 text-success" />}
          label="Accuracy"
          value={`${accuracy}%`}
          sub={`${state.correct_answers}/${state.total_answers}`}
        />
        <StatItem
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Difficulty"
          value={Number(state.current_difficulty).toFixed(1)}
          sub={`Max streak: ${state.max_streak}${streakRank ? ` (#${streakRank})` : ""}`}
        />
      </div>

      {/* Leaderboard positions banner */}
      {(scoreRank || streakRank) && (
        <div className="flex items-center justify-center gap-4 bg-card/50 border border-border rounded-lg px-4 py-2">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="text-sm text-muted-foreground">
            {scoreRank && (
              <span className="text-foreground">Score: #{scoreRank}</span>
            )}
            {scoreRank && streakRank && <span className="mx-2">·</span>}
            {streakRank && (
              <span className="text-foreground">Streak: #{streakRank}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
  sub,
  glow,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  glow?: "primary" | "accent";
}) {
  return (
    <div
      className={`bg-card border border-border rounded-lg p-3 ${glow === "primary" ? "glow-primary" : glow === "accent" ? "glow-accent" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-lg font-mono font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
