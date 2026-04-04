import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number; // 0-100
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 50) return "bg-blue-500";
  if (score >= 25) return "bg-amber-500";
  return "bg-red-500";
}

export function ScoreBar({
  score,
  label,
  showValue = true,
  size = "md",
  className,
}: ScoreBarProps) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-slate-500 font-medium">{label}</span>
          )}
          {showValue && (
            <span className="text-xs font-semibold text-slate-700">
              {Math.round(pct)}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-slate-100",
          size === "sm" ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", scoreColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
