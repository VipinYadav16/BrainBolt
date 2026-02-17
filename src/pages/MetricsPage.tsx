import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";
import { useMetrics } from "@/hooks/useMetrics";
import {
  Loader2,
  Target,
  TrendingUp,
  Zap,
  Flame,
  Calendar,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MetricsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { metrics, loading: metricsLoading } = useMetrics(user?.id ?? null);

  if (authLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6 font-mono">
          📊 Performance Metrics
        </h1>

        {metricsLoading || !metrics ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={<Zap className="h-5 w-5 text-primary" />}
                label="Total Score"
                value={metrics.totalScore.toLocaleString()}
                className="glow-primary"
              />
              <MetricCard
                icon={<Flame className="h-5 w-5 text-accent" />}
                label="Max Streak"
                value={`${metrics.maxStreak} 🔥`}
                className="glow-accent"
              />
              <MetricCard
                icon={<Target className="h-5 w-5 text-success" />}
                label="Accuracy"
                value={`${metrics.accuracy}%`}
                sub={`${metrics.correctAnswers}/${metrics.totalAnswers}`}
              />
              <MetricCard
                icon={<TrendingUp className="h-5 w-5 text-primary" />}
                label="Current Difficulty"
                value={metrics.currentDifficulty.toFixed(1)}
              />
            </div>

            {/* Difficulty Histogram */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Difficulty Distribution
              </h3>
              <div className="grid grid-cols-10 gap-2 items-end h-40">
                {metrics.difficultyHistogram.map((count, i) => {
                  const maxCount = Math.max(...metrics.difficultyHistogram, 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-full rounded-t transition-all duration-300",
                          count > 0 ? "bg-primary" : "bg-muted",
                        )}
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`Difficulty ${i + 1}: ${count} questions`}
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Questions answered by difficulty level
              </p>
            </div>

            {/* Recent Performance */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Performance (Last 10 answers)
              </h3>
              <div className="flex gap-2 justify-center">
                {metrics.recentPerformance.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No recent answers
                  </p>
                ) : (
                  metrics.recentPerformance.map((correct, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold transition-all",
                        correct
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-destructive/20 text-destructive border border-destructive/30",
                      )}
                      title={correct ? "Correct" : "Wrong"}
                    >
                      {correct ? "✓" : "✗"}
                    </div>
                  ))
                )}
              </div>
              {metrics.recentPerformance.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Recent accuracy:{" "}
                  {Math.round(
                    (metrics.recentCorrect / metrics.recentTotal) * 100,
                  )}
                  %
                </p>
              )}
            </div>

            {/* Session Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">
                Session Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Current Streak</span>
                  <p className="text-lg font-bold text-foreground">
                    {metrics.streak}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Momentum</span>
                  <p
                    className={cn(
                      "text-lg font-bold",
                      metrics.momentum > 0
                        ? "text-success"
                        : metrics.momentum < 0
                          ? "text-destructive"
                          : "text-foreground",
                    )}
                  >
                    {metrics.momentum > 0 ? "+" : ""}
                    {metrics.momentum.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">State Version</span>
                  <p className="text-lg font-bold text-foreground font-mono">
                    v{metrics.stateVersion}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Active</span>
                  <p className="text-lg font-bold text-foreground">
                    {metrics.lastAnswerAt
                      ? new Date(metrics.lastAnswerAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function MetricCard({
  icon,
  label,
  value,
  sub,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-card border border-border rounded-lg p-4", className)}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-mono font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default MetricsPage;
