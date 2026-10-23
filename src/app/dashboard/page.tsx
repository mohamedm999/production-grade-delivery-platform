"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MOCK_DASHBOARD_STATS,
  MOCK_ORDERS,
  MOCK_DELIVERY_ZONES,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Clock,
  Package,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  Map,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const recentOrders = MOCK_ORDERS.slice(0, 4);

  return (
    <AppLayout>
      <PageHeader
        title="Operations Overview"
        description="Live delivery fleet statistics, active zones, and pending fulfillment."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Live
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/products">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Product
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="primary" size="sm">
                Dispatch Orders
              </Button>
            </Link>
          </div>
        }
      />

      {/* Demo notice banner */}
      <div className="mb-6 rounded-xl bg-indigo-50/60 p-4 border border-indigo-100 flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-950">
            <strong className="font-semibold">Phase 1 View:</strong> Displaying structured demonstration data. Database binding occurs in Phase 2.
          </p>
        </div>
        <span className="text-[11px] font-medium text-indigo-700 bg-white/80 px-2.5 py-1 rounded-md border border-indigo-200 shrink-0">
          Mobile-First Verified
        </span>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Total Orders */}
        <Card compact className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-600">Total Orders</span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {MOCK_DASHBOARD_STATS.totalOrders}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-emerald-600 gap-1 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>+18% from yesterday</span>
            </div>
          </div>
        </Card>

        {/* Pending Orders */}
        <Card compact className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-600">Pending Dispatch</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {MOCK_DASHBOARD_STATS.pendingOrders}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-amber-700 gap-1 font-medium">
              <span>Requires staff action</span>
            </div>
          </div>
        </Card>

        {/* Catalog Products */}
        <Card compact className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-600">Active Products</span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {MOCK_DASHBOARD_STATS.activeProducts}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-slate-500 gap-1 font-medium">
              <span>In inventory</span>
            </div>
          </div>
        </Card>

        {/* Delivery Zones */}
        <Card compact className="flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium text-slate-600">Delivery Zones</span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {MOCK_DASHBOARD_STATS.deliveryZones}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-purple-700 gap-1 font-medium">
              <span>3 active / 1 paused</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Orders & Active Zones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (Span 2) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer orders awaiting fulfillment or transit</CardDescription>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900">{order.orderNumber}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-700">{order.customerName}</span>
                      <Badge status={order.status} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{order.deliveryAddress}</p>
                    <div className="text-[11px] text-slate-400">
                      Zone: <span className="font-medium text-slate-600">{order.zoneName}</span> • {order.items.length} items
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Active Delivery Zones Snapshot (Span 1) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Delivery Zones</CardTitle>
                <CardDescription>Configured operational polygons</CardDescription>
              </div>
              <Link
                href="/delivery-zones"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            <div className="space-y-3">
              {MOCK_DELIVERY_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <span className="text-xs font-semibold text-slate-800">{zone.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Fee: <strong className="text-slate-700">{formatCurrency(zone.deliveryFee)}</strong> • {zone.coverageAreaKm2} km²
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      zone.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {zone.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link href="/delivery-zones" className="w-full block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Map className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  Open Interactive Map View
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
