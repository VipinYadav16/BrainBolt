import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, Flame, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  userId?: string | null;
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const { entries: scoreEntries, userRank: scoreRank, loading: scoreLoading } = useLeaderboard('score', userId);
  const { entries: streakEntries, userRank: streakRank, loading: streakLoading } = useLeaderboard('streak', userId);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <LeaderboardPanel
        title="Top Scores"
        icon={<Trophy className="h-5 w-5 text-accent" />}
        entries={scoreEntries}
        valueKey="total_score"
        valueLabel="pts"
        userId={userId}
        userRank={scoreRank}
        loading={scoreLoading}
      />
      <LeaderboardPanel
        title="Top Streaks"
        icon={<Flame className="h-5 w-5 text-accent" />}
        entries={streakEntries}
        valueKey="max_streak"
        valueLabel="🔥"
        userId={userId}
        userRank={streakRank}
        loading={streakLoading}
      />
    </div>
  );
}

function LeaderboardPanel({
  title,
  icon,
  entries,
  valueKey,
  valueLabel,
  userId,
  userRank,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  entries: any[];
  valueKey: string;
  valueLabel: string;
  userId?: string | null;
  userRank: number | null;
  loading: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {userRank && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-mono">
            Your rank: #{userRank}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No entries yet. Be the first!
        </div>
      ) : (
        <div className="divide-y divide-border">
          {entries.slice(0, 10).map((entry, i) => (
            <div
              key={entry.user_id}
              className={cn(
                'flex items-center justify-between px-4 py-3 transition-colors',
                entry.user_id === userId && 'bg-primary/5 border-l-2 border-l-primary'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold',
                  i === 0 ? 'bg-accent text-accent-foreground' :
                  i === 1 ? 'bg-muted text-foreground' :
                  i === 2 ? 'bg-accent/30 text-accent' :
                  'bg-secondary text-muted-foreground'
                )}>
                  {i + 1}
                </span>
                <span className={cn(
                  'font-medium text-sm',
                  entry.user_id === userId ? 'text-primary' : 'text-foreground'
                )}>
                  {entry.username || 'Player'}
                  {entry.user_id === userId && ' (you)'}
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-foreground">
                {Number(entry[valueKey]).toLocaleString()} {valueLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
