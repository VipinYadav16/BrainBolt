import { useAuth } from '@/hooks/useAuth';
import { Leaderboard } from '@/components/Leaderboard';
import { Header } from '@/components/Header';
import { AuthForm } from '@/components/AuthForm';

const LeaderboardPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <AuthForm />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6 font-mono">
          🏆 Leaderboards
        </h1>
        <Leaderboard userId={user.id} />
      </main>
    </div>
  );
};

export default LeaderboardPage;
