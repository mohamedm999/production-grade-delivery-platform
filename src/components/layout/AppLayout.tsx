"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <Sidebar />
      <MobileNav />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 overflow-x-hidden pb-20 md:pb-8">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
