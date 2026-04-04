import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 border border-blue-600",
  secondary:
    "bg-slate-800 text-white hover:bg-slate-900 active:bg-slate-950 border border-slate-800",
  outline:
    "bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 border border-red-600",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
