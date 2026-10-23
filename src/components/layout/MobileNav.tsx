"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  ShoppingBag,
  Truck,
  Menu,
  X,
  LogOut,
  Info,
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
    name: "Zones",
    href: "/delivery-zones",
    icon: MapPin,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
];

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    setDrawerOpen(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Truck className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm text-slate-900 tracking-tight">SwiftDispatch</span>
        </div>

        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          aria-label="Toggle navigation menu"
        >
          {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Side Drawer (Slide-over) */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80%] flex-1 flex-col bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">SwiftDispatch Navigation</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-4 space-y-1.5 flex-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 flex gap-2">
                <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Phase 2: Supabase Auth Session Guard Active.</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <LogOut className="h-4 w-4 text-slate-400" />
                )}
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Fixed Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-16 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-sm safe-area-bottom"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1 transition-colors min-w-[56px] min-h-[44px]",
                isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.25]" : "stroke-[1.75]")} />
              <span className={cn("text-[10px] mt-0.5 tracking-tight", isActive ? "font-semibold" : "font-normal")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
