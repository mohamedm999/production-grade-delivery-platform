"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { MOCK_ORDERS, Order, OrderStatus } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  ShoppingBag,
  Search,
  Eye,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.zoneName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: newStatus } : o))
    );
    setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    setSuccessNotice(`Order ${selectedOrder.orderNumber} status changed to "${newStatus}" locally.`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Customer Orders"
        description="Fulfillment queue, delivery status tracking, and dispatch verification."
        badge={
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {filteredOrders.length} orders
          </span>
        }
      />

      {/* Advisory Notice */}
      <div className="mb-6 rounded-xl bg-slate-100/80 p-3.5 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Phase 1 Order Management: </span>
          Inspect modal and status transitions demonstrate local UI responsiveness. Database persistence connects in Phase 2, and server-side delivery validation connects in Phase 4.
        </div>
      </div>

      {successNotice && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order #, customer, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-slate-400 mr-1 hidden sm:inline" />
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "processing", label: "Processing" },
            { id: "out_for_delivery", label: "In Transit" },
            { id: "delivered", label: "Delivered" },
            { id: "cancelled", label: "Cancelled" },
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
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description={
            searchTerm || statusFilter !== "all"
              ? "No orders match your filter criteria. Try resetting filters."
              : "No customer orders recorded yet."
          }
          action={
            (searchTerm || statusFilter !== "all") && (
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
          {/* Mobile Cards (hidden on md+) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredOrders.map((order) => (
              <Card key={order.id} compact className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                      <Badge status={order.status} />
                    </div>
                    <p className="text-xs font-medium text-slate-700 mt-1">{order.customerName}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(order.total)}</span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{order.deliveryAddress}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Zone: <strong className="text-slate-600">{order.zoneName}</strong></span>
                    <span>{order.items.length} item(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="h-8 text-xs font-medium"
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Inspect Order
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order #</th>
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
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {order.orderNumber}
                      <div className="text-[11px] font-normal text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{order.customerName}</div>
                      <div className="text-xs text-slate-400">{order.customerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 max-w-xs truncate">{order.deliveryAddress}</div>
                      <div className="text-[11px] text-slate-400">
                        Zone: <span className="font-medium text-slate-600">{order.zoneName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={order.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(order.total)}
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
          title={`Order Details: ${selectedOrder.orderNumber}`}
          description={`Placed on ${new Date(selectedOrder.createdAt).toLocaleDateString()} at ${new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
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
                Update Status (Demo Interaction)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["pending", "processing", "out_for_delivery", "delivered", "cancelled"] as OrderStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatus(st)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                        selectedOrder.status === st
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Customer & Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recipient
                </span>
                <div className="text-xs font-semibold text-slate-900">{selectedOrder.customerName}</div>
                <div className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {selectedOrder.customerPhone}
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Delivery Destination
                </span>
                <div className="text-xs text-slate-800 line-clamp-2">{selectedOrder.deliveryAddress}</div>
                <div className="text-[11px] text-slate-500">
                  Coords: {selectedOrder.coordinates.lat.toFixed(4)}, {selectedOrder.coordinates.lng.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Order Items ({selectedOrder.items.length})
              </span>
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">{item.productName}</span>
                      <span className="text-slate-400 ml-1.5">x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Surcharge ({selectedOrder.zoneName})</span>
                <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200 text-sm">
                <span>Total Amount</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
