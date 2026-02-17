import { useState } from "react";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuizCardProps {
  question: Question;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  result?: {
    correct: boolean;
    correctAnswer: string;
    scoreDelta: number;
    streakDecayed?: boolean;
  } | null;
  onNext?: () => void;
}

export function QuizCard({
  question,
  onAnswer,
  disabled,
  result,
  onNext,
}: QuizCardProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (choice: string) => {
    if (disabled || result) return;
    setSelected(choice);
    onAnswer(choice);
  };

  const getChoiceStyle = (choice: string) => {
    if (!result) {
      return selected === choice
        ? "border-primary bg-primary/10 glow-primary"
        : "border-border bg-secondary hover:border-primary/50 hover:bg-primary/5";
    }

    if (choice === result.correctAnswer) {
      return "border-success bg-success/10 glow-success";
    }
    if (selected === choice && !result.correct) {
      return "border-destructive bg-destructive/10 glow-destructive";
    }
    return "border-border bg-secondary opacity-50";
  };

  return (
    <div className="animate-slide-up space-y-6">
      {/* Category & Difficulty */}
      <div className="flex items-center justify-between text-sm">
        <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full font-medium capitalize">
          {question.category}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i < question.difficulty ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed">
        {question.prompt}
      </h2>

      {/* Choices */}
      <div className="grid gap-3">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => handleSelect(choice)}
            disabled={disabled || !!result}
            className={cn(
              "w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-200 font-medium",
              "flex items-center gap-3",
              getChoiceStyle(choice),
            )}
          >
            <span className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-sm font-mono text-muted-foreground shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-foreground">{choice}</span>
          </button>
        ))}
      </div>

      {/* Result feedback */}
      {result && (
        <div className="animate-score-pop space-y-4">
          {result.streakDecayed ? (
            <div className="text-center py-3 rounded-lg font-semibold text-lg bg-accent/10 text-accent">
              ⏰ Streak decayed due to inactivity! Keep playing to rebuild.
            </div>
          ) : (
            <div
              className={cn(
                "text-center py-3 rounded-lg font-semibold text-lg",
                result.correct
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {result.correct ? (
                <span>✓ Correct! +{result.scoreDelta} pts</span>
              ) : (
                <span>✗ Wrong — {result.correctAnswer}</span>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setSelected(null);
              onNext?.();
            }}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Next Question →
          </button>
        </div>
      )}
    </div>
  );
}
