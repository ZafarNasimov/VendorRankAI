import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-slate-400" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      {description && (
        <p className="text-sm text-slate-400 max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
