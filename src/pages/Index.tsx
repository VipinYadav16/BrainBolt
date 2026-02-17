import { useAuth } from "@/hooks/useAuth";
import { useQuiz } from "@/hooks/useQuiz";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { AuthForm } from "@/components/AuthForm";
import { QuizCard } from "@/components/QuizCard";
import { StatsBar } from "@/components/StatsBar";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    userState,
    currentQuestion,
    loading,
    answering,
    lastResult,
    submitAnswer,
    nextQuestion,
  } = useQuiz(user?.id ?? null);
  const { userRank: scoreRank } = useLeaderboard("score", user?.id);
  const { userRank: streakRank } = useLeaderboard("streak", user?.id);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {loading || !userState ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StatsBar
              state={userState}
              scoreRank={scoreRank}
              streakRank={streakRank}
            />

            {currentQuestion ? (
              <div className="bg-card border border-border rounded-lg p-6">
                <QuizCard
                  question={currentQuestion}
                  onAnswer={submitAnswer}
                  disabled={answering}
                  result={lastResult}
                  onNext={nextQuestion}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
