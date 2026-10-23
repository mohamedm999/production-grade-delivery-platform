import React from "react";
import { cn } from "@/lib/utils";
import { OrderStatus } from "@/lib/mock-data";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  status?: OrderStatus;
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", status, children, ...props }) => {
  let badgeVariant = variant;
  let label = children;

  if (status) {
    switch (status) {
      case "pending":
        badgeVariant = "warning";
        label = label || "Pending";
        break;
      case "processing":
        badgeVariant = "info";
        label = label || "Processing";
        break;
      case "out_for_delivery":
        badgeVariant = "default";
        label = label || "Out for Delivery";
        break;
      case "delivered":
        badgeVariant = "success";
        label = label || "Delivered";
        break;
      case "cancelled":
        badgeVariant = "danger";
        label = label || "Cancelled";
        break;
    }
  }

  const variantStyles = {
    default: "bg-indigo-50 text-indigo-700 border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight",
        variantStyles[badgeVariant],
        className
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
};
