import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, compact = false, children, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-sm",
        compact ? "p-4" : "p-5 sm:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
  return (
    <h3 className={cn("text-base font-semibold text-slate-900 tracking-tight", className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
  return (
    <p className={cn("text-xs text-slate-500 mt-0.5", className)} {...props}>
      {children}
    </p>
  );
};
