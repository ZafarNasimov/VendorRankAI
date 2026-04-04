import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Zap,
  Trophy,
  UserCheck,
  Lock,
} from "lucide-react";

type ChipType =
  | "ai-recommended"
  | "selected"
  | "overridden"
  | "finalized"
  | "on-hedera"
  | "pending"
  | "draft"
  | "open"
  | "evaluated"
  | "decided";

const chipConfig: Record<
  ChipType,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  "ai-recommended": {
    label: "AI Recommended",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    Icon: Zap,
  },
  selected: {
    label: "Selected",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: Trophy,
  },
  overridden: {
    label: "Override",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: AlertTriangle,
  },
  finalized: {
    label: "Finalized",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: Lock,
  },
  "on-hedera": {
    label: "On Hedera",
    className: "bg-teal-50 text-teal-700 border-teal-200",
    Icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    className: "bg-slate-50 text-slate-500 border-slate-200",
    Icon: Clock,
  },
  draft: {
    label: "Draft",
    className: "bg-slate-50 text-slate-500 border-slate-200",
    Icon: Clock,
  },
  open: {
    label: "Open",
    className: "bg-blue-50 text-blue-600 border-blue-200",
    Icon: CheckCircle2,
  },
  evaluated: {
    label: "Evaluated",
    className: "bg-purple-50 text-purple-700 border-purple-200",
    Icon: Zap,
  },
  decided: {
    label: "Decided",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: UserCheck,
  },
};

interface StatusChipProps {
  type: ChipType;
  className?: string;
}

export function StatusChip({ type, className }: StatusChipProps) {
  const { label, className: base, Icon } = chipConfig[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        base,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export function TenderStatusChip({
  status,
}: {
  status: string;
}) {
  const map: Record<string, ChipType> = {
    DRAFT: "draft",
    OPEN: "open",
    EVALUATED: "evaluated",
    DECIDED: "decided",
    FINALIZED: "finalized",
  };
  const type = map[status] ?? "draft";
  return <StatusChip type={type} />;
}
