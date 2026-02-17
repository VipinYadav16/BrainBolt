import { Zap, LogOut, Trophy, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="font-mono font-bold text-lg text-foreground">
            Brain<span className="text-primary">Bolt</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user && (
            <>
              <Link
                to="/"
                className={cn(
                  "text-sm font-medium transition-colors",
                  location.pathname === "/"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Quiz
              </Link>
              <Link
                to="/leaderboard"
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1",
                  location.pathname === "/leaderboard"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
              <Link
                to="/metrics"
                className={cn(
                  "text-sm font-medium transition-colors flex items-center gap-1",
                  location.pathname === "/metrics"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BarChart3 className="h-4 w-4" />
                Metrics
              </Link>
            </>
          )}
          <ThemeToggle />
          {user && (
            <button
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
