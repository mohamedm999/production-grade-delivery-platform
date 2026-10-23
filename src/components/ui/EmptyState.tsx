import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500 shadow-inner">
          <Icon className="h-6 w-6 stroke-[1.75]" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
