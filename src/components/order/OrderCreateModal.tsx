"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationPicker } from "@/components/map/LocationPicker";
import { DatabaseDeliveryZone, DatabaseProduct } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User,
  Phone,
  MapPin,
} from "lucide-react";

export interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface SelectedLineItem {
  productId: string;
  quantity: number;
}

export function OrderCreateModal({
  isOpen,
  onClose,
  onOrderCreated,
}: OrderCreateModalProps) {
  // Database data
  const [products, setProducts] = useState<DatabaseProduct[]>([]);
  const [zones, setZones] = useState<DatabaseDeliveryZone[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [items, setItems] = useState<SelectedLineItem[]>([]);

  // Eligibility state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [eligibility, setEligibility] = useState<{
    isEligible: boolean;
    matchingZone: DatabaseDeliveryZone | null;
    deliveryFee: number;
    reason?: string;
  } | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load products and delivery zones when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoadingData(true);
      try {
        const supabase = createClient();
        const [prodRes, zoneRes] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .eq("is_available", true)
            .gt("stock", 0)
            .order("name"),
          supabase
            .from("delivery_zones")
            .select("*")
            .order("name"),
        ]);

        if (isMounted) {
          setProducts(prodRes.data || []);
          setZones(zoneRes.data || []);

          // Pre-populate with first product if available
          if (prodRes.data && prodRes.data.length > 0) {
            setItems((prev) =>
              prev.length === 0 ? [{ productId: prodRes.data![0].id, quantity: 1 }] : prev
            );
          }
        }
      } catch (err) {
        console.error("Failed to load products/zones for order modal:", err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Check eligibility whenever coordinates change
  useEffect(() => {
    if (!coordinates) {
      setEligibility(null);
      return;
    }

    const currentLat = coordinates.lat;
    const currentLng = coordinates.lng;
    let isMounted = true;
    async function checkLocation() {
      setIsCheckingEligibility(true);
      try {
        const res = await fetch("/api/delivery/check-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: currentLat, lng: currentLng }),
        });
        const data = await res.json();
        if (isMounted) {
          setEligibility(data);
        }
      } catch (err) {
        console.error("Eligibility check failed:", err);
      } finally {
        if (isMounted) setIsCheckingEligibility(false);
      }
    }

    checkLocation();
    return () => {
      isMounted = false;
    };
  }, [coordinates]);

  // Financial calculations
  const subtotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return sum;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  const deliveryFee = eligibility?.isEligible ? Number(eligibility.deliveryFee) : 0;
  const grandTotal = subtotal + deliveryFee;

  // Item management
  const handleAddItem = () => {
    if (products.length === 0) return;
    const availableUnselected = products.find(
      (p) => !items.some((it) => it.productId === p.id)
    );
    const idToAdd = availableUnselected ? availableUnselected.id : products[0].id;
    setItems((prev) => [...prev, { productId: idToAdd, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { productId, quantity } : it))
    );
  };

  // Submit order
  const handleSubmitOrder = async (recordAsRejected = false) => {
    setFormError(null);

    if (!customerName.trim()) {
      setFormError("Please enter the customer name.");
      return;
    }

    if (!customerPhone.trim()) {
      setFormError("Please enter a customer phone number.");
      return;
    }

    if (!customerAddress.trim()) {
      setFormError("Please enter a customer delivery address.");
      return;
    }

    if (!coordinates) {
      setFormError("Please select the delivery location coordinates on the map.");
      return;
    }

    if (items.length === 0) {
      setFormError("Please select at least one product.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_address: customerAddress.trim(),
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          items: items.map((it) => ({
            product_id: it.productId,
            quantity: it.quantity,
          })),
          allow_rejected_save: recordAsRejected,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          // Outside delivery zone
          setFormError(
            "Selected location is outside our active delivery zones. You can reposition the pin, or record it as a rejected dispatch."
          );
        } else {
          setFormError(data.error || "Failed to create order.");
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      onOrderCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error creating order.";
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Delivery Order"
      description="Select products, pin the customer location, and validate zone eligibility."
      maxWidth="lg"
    >
      {isLoadingData ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500">Loading catalog and active zones...</p>
        </div>
      ) : (
        <div className="space-y-5">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{formError}</p>
                {eligibility && !eligibility.isEligible && (
                  <button
                    type="button"
                    onClick={() => handleSubmitOrder(true)}
                    className="text-xs font-semibold text-rose-700 underline block pt-1 hover:text-rose-900"
                  >
                    Record this order as &apos;Rejected&apos; anyway &rarr;
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span>Customer Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                placeholder="e.g. John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Input
                label="Phone Number *"
                placeholder="e.g. +1 555-0199 or 0661234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Input
              label="Delivery Street Address *"
              placeholder="e.g. 142 Boulevard d'Anfa, Apt 5"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Map Location Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-indigo-600" />
              <span>Delivery Location & Zone Check</span>
            </h4>

            {/* Real-Time Server Eligibility Indicator */}
            {coordinates && (
              <div className="rounded-lg p-2.5 text-xs flex items-center justify-between border transition-all">
                {isCheckingEligibility ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span>Verifying server-side zone eligibility...</span>
                  </div>
                ) : eligibility?.isEligible ? (
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Eligible for Delivery!</strong> Inside{" "}
                      <strong>{eligibility.matchingZone?.name}</strong> (Fee:{" "}
                      {formatCurrency(eligibility.deliveryFee)})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Outside Active Zones.</strong> {eligibility?.reason}
                    </span>
                  </div>
                )}
                {eligibility?.isEligible && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    Validated
                  </span>
                )}
              </div>
            )}

            <LocationPicker
              zones={zones}
              value={coordinates}
              onChange={setCoordinates}
              helperText="Click within a shaded active delivery zone to place the customer pin."
            />
          </div>

          {/* Product Items Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                <span>Order Products ({items.length})</span>
              </h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isSubmitting || products.length === 0}
                className="text-xs h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No products added. Click &quot;Add Item&quot; above.</p>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  const currentProduct = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5"
                    >
                      {/* Product Selector */}
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(index, e.target.value, item.quantity)}
                        disabled={isSubmitting}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(p.price)} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>

                      {/* Quantity Input */}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500 shrink-0">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          max={currentProduct?.stock || 99}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleUpdateItem(index, item.productId, isNaN(val) ? 1 : Math.max(1, val));
                          }}
                          disabled={isSubmitting}
                          className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-800 min-w-[70px] text-right">
                          {formatCurrency((currentProduct ? Number(currentProduct.price) : 0) * item.quantity)}
                        </span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isSubmitting}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trusted Financial Breakdown */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>
                Delivery Fee{" "}
                {eligibility?.matchingZone ? `(${eligibility.matchingZone.name})` : "(Pending Location)"}
              </span>
              <span className="font-medium text-slate-800">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
              <span>Grand Total</span>
              <span className="text-indigo-600">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              <span>Prices and stock re-verified by server before recording.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSubmitOrder(false)}
              isLoading={isSubmitting}
              disabled={isSubmitting || items.length === 0 || !coordinates}
            >
              Confirm & Create Order
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
