"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  ShoppingBag,
  LogOut,
  Truck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Delivery Zones",
    href: "/delivery-zones",
    icon: MapPin,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setIsLoggingOut(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <span className="font-semibold text-sm text-slate-900 tracking-tight block">SwiftDispatch</span>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Staff Operations</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Management
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Security & Logout Bar */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
            <span>Phase 2 Security</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 leading-tight">
            Supabase Auth & RLS guard active.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <LogOut className="h-4 w-4 text-slate-400" />
          )}
          <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
};
