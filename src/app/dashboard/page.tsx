"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { DatabaseOrder, DatabaseDeliveryZone } from "@/lib/types/database";
import {
  ShoppingBag,
  Clock,
  Package,
  MapPin,
  ArrowUpRight,
  TrendingUp,
  Map,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalZones: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalZones: 0,
  });
  const [recentOrders, setRecentOrders] = useState<DatabaseOrder[]>([]);
  const [zones, setZones] = useState<DatabaseDeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // 1. Orders count & pending count
      const { count: orderCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // 2. Products count
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // 3. Delivery Zones count
      const { count: zoneCount } = await supabase
        .from("delivery_zones")
        .select("*", { count: "exact", head: true });

      setStats({
        totalOrders: orderCount || 0,
        pendingOrders: pendingCount || 0,
        totalProducts: productCount || 0,
        totalZones: zoneCount || 0,
      });

      // 4. Recent orders list
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders(ordersData || []);

      // 5. Active delivery zones
      const { data: zonesData } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      setZones(zonesData || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AppLayout>
      <PageHeader
        title="Operations Overview"
        description="Live delivery fleet statistics, active zones, and pending fulfillment from Supabase."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Live
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button onClick={fetchDashboardData} variant="outline" size="sm" title="Refresh dashboard">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
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
              {isLoading ? "..." : stats.totalOrders}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-slate-500 gap-1 font-medium">
              <span>Recorded in database</span>
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
              {isLoading ? "..." : stats.pendingOrders}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-amber-700 gap-1 font-medium">
              <span>{stats.pendingOrders > 0 ? "Requires staff action" : "All dispatched"}</span>
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
              {isLoading ? "..." : stats.totalProducts}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-slate-500 gap-1 font-medium">
              <span>In inventory catalog</span>
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
              {isLoading ? "..." : stats.totalZones}
            </div>
            <div className="mt-1 flex items-center text-[11px] text-purple-700 gap-1 font-medium">
              <span>Geofenced zones</span>
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
                <CardDescription>Live customer orders from Supabase</CardDescription>
              </div>
              <Link
                href="/orders"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-500">Loading orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No orders recorded in Supabase yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-700">{order.customer_name}</span>
                        <Badge status={order.status} />
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{order.customer_address}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Active Delivery Zones Snapshot (Span 1) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Delivery Zones</CardTitle>
                <CardDescription>Configured operational polygons in PostgreSQL</CardDescription>
              </div>
              <Link
                href="/delivery-zones"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <p className="text-xs text-slate-500">Loading zones...</p>
              </div>
            ) : zones.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No delivery zones configured yet.
              </div>
            ) : (
              <div className="space-y-3">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: zone.color || "#4f46e5" }}
                        />
                        <span className="text-xs font-semibold text-slate-800">{zone.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Fee: <strong className="text-slate-700">{formatCurrency(zone.delivery_fee)}</strong>
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        zone.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {zone.active ? "Active" : "Paused"}
                    </span>
                  </div>
                ))}
              </div>
            )}

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
