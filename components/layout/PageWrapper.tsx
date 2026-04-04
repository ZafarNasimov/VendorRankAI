import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", className)}>
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
}
