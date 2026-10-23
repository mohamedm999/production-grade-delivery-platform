"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DatabaseOrder, DatabaseOrderItem, OrderStatus } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { OrderCreateModal } from "@/components/order/OrderCreateModal";
import {
  ShoppingBag,
  Search,
  Eye,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Filter,
  Loader2,
  RefreshCw,
  Plus,
} from "lucide-react";

interface EnrichedOrder extends DatabaseOrder {
  delivery_zones?: { name: string; delivery_fee: number } | null;
  order_items?: (DatabaseOrderItem & { products?: { name: string; category?: string } | null })[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<EnrichedOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*, delivery_zones(name, delivery_fee), order_items(*, products(name, category))")
        .order("created_at", { ascending: false });

      if (error) {
        setStatusNotice({ type: "error", message: `Supabase Error: ${error.message}` });
      } else {
        setOrders(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders from Supabase.";
      setStatusNotice({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      setStatusNotice({ type: "success", message: `Order status updated to "${newStatus}" in Supabase!` });
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order status.";
      setStatusNotice({ type: "error", message: msg });
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.delivery_zones?.name && order.delivery_zones.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <PageHeader
        title="Customer Orders"
        description="Live order creation and geofenced fulfillment records from Supabase."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Supabase Live
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button onClick={fetchOrders} variant="outline" size="sm" title="Refresh orders">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Order
            </Button>
          </div>
        }
      />

      {statusNotice && (
        <div
          className={`mb-4 rounded-lg p-3 text-xs font-medium flex items-center gap-2 border ${
            statusNotice.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{statusNotice.message}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, customer name, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:inline" />
          {[
            { id: "all", label: "All Orders" },
            { id: "validated", label: "Validated" },
            { id: "pending", label: "Pending" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Table */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500">Loading orders from Supabase database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={orders.length === 0 ? "No orders in Supabase database" : "No orders matched your filter"}
          description={
            orders.length === 0
              ? "Your orders table in Supabase is currently empty. Click below to create your first order with delivery zone validation."
              : "No orders match your filter criteria. Try resetting search or status filters."
          }
          action={
            orders.length === 0 ? (
              <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create First Order
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} compact className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        #{order.id.slice(0, 8)}
                      </span>
                      <Badge status={order.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1">{order.customer_name}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{order.customer_address}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Zone:{" "}
                      <strong className={order.delivery_zones?.name ? "text-slate-700" : "text-amber-600"}>
                        {order.delivery_zones?.name || "Outside Service Area"}
                      </strong>
                    </span>
                    <span>{order.order_items?.length || 0} item(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="h-8 text-xs font-medium"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Location</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                      #{order.id.slice(0, 8)}
                      <div className="text-[11px] font-normal text-slate-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{order.customer_name}</div>
                      {order.customer_phone && (
                        <div className="text-xs text-slate-400">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 max-w-xs truncate">{order.customer_address}</div>
                      <div className="text-[11px] text-slate-400">
                        Zone:{" "}
                        <span className={order.delivery_zones?.name ? "font-medium text-slate-700" : "font-medium text-amber-600"}>
                          {order.delivery_zones?.name || "Outside Service Area"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                        className="h-8 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details: #${selectedOrder.id.slice(0, 8)}`}
          description={`Placed on ${new Date(selectedOrder.created_at).toLocaleDateString()} at ${new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        >
          <div className="space-y-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 border border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Dispatch Status</span>
              <Badge status={selectedOrder.status} />
            </div>

            {/* Quick Status Changers */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Update Status (Writes to Supabase)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["pending", "validated", "rejected"] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(st)}
                    className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors ${
                      selectedOrder.status === st
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Mark as {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recipient
                </span>
                <div className="text-xs font-semibold text-slate-900">{selectedOrder.customer_name}</div>
                {selectedOrder.customer_phone && (
                  <div className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {selectedOrder.customer_phone}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Delivery Destination
                </span>
                <div className="text-xs text-slate-800 line-clamp-2">{selectedOrder.customer_address}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Coordinates: {selectedOrder.latitude.toFixed(5)}, {selectedOrder.longitude.toFixed(5)}
                </div>
                <div className="text-[11px] text-slate-600">
                  Assigned Zone:{" "}
                  <strong>{selectedOrder.delivery_zones?.name || "Outside Active Zones"}</strong>
                </div>
              </div>
            </div>

            {/* Line Items */}
            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Order Items ({selectedOrder.order_items.length})
                </span>
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">
                          {item.products?.name || "Product"}
                        </span>
                        <span className="text-slate-400 ml-1.5">x{item.quantity}</span>
                      </div>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Amount</span>
                <span>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Order Creation Modal */}
      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={fetchOrders}
      />
    </AppLayout>
  );
}
