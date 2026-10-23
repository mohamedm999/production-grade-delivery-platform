"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DatabaseDeliveryZone } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin,
  Plus,
  Map,
  Compass,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Layers,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DatabaseDeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formColor, setFormColor] = useState("#4f46e5");
  const [formCoordinates, setFormCoordinates] = useState(
    JSON.stringify(
      [
        [-7.63, 33.6],
        [-7.59, 33.6],
        [-7.59, 33.575],
        [-7.63, 33.575],
        [-7.63, 33.6],
      ],
      null,
      2
    )
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchZones = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setStatusNotice({ type: "error", message: `Supabase Error: ${error.message}` });
      } else {
        setZones(data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load delivery zones.";
      setStatusNotice({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const toggleZoneStatus = async (id: string, currentActive: boolean, name: string) => {
    try {
      const supabase = createClient();
      const nextActive = !currentActive;
      const { error } = await supabase
        .from("delivery_zones")
        .update({ active: nextActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setZones((prev) =>
        prev.map((z) => (z.id === id ? { ...z, active: nextActive } : z))
      );
      setStatusNotice({
        type: "success",
        message: `Zone "${name}" is now ${nextActive ? "Active" : "Paused"}.`,
      });
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update zone status.";
      setStatusNotice({ type: "error", message: msg });
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Permanently delete delivery zone "${name}" from Supabase?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;

      setZones((prev) => prev.filter((z) => z.id !== id));
      setStatusNotice({ type: "success", message: `Deleted zone "${name}".` });
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete zone.";
      setStatusNotice({ type: "error", message: msg });
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Zone name is required.");
      return;
    }
    const feeNum = parseFloat(formFee);
    if (isNaN(feeNum) || feeNum < 0) {
      setFormError("Please enter a valid delivery fee (e.g. 2.50).");
      return;
    }

    let parsedCoords: number[][];
    try {
      parsedCoords = JSON.parse(formCoordinates);
      if (!Array.isArray(parsedCoords) || parsedCoords.length < 3) {
        throw new Error("Coordinates must be an array of at least 3 [lng, lat] points.");
      }
    } catch (err: unknown) {
      setFormError("Invalid polygon JSON: must be valid GeoJSON coordinate array [[lng, lat], ...].");
      return;
    }

    // Ensure polygon is closed (first and last match)
    const first = parsedCoords[0];
    const last = parsedCoords[parsedCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      parsedCoords.push([...first]);
    }

    const polygonPayload = {
      type: "Polygon",
      coordinates: [parsedCoords],
    };

    setIsSaving(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("delivery_zones").insert({
        name: formName.trim(),
        delivery_fee: feeNum,
        color: formColor,
        active: true,
        polygon: polygonPayload,
      });

      if (error) throw error;

      setIsModalOpen(false);
      setFormName("");
      setFormFee("");
      setStatusNotice({ type: "success", message: `Saved "${formName}" into Supabase!` });
      await fetchZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save delivery zone.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Delivery Zones"
        description="Geofenced boundaries stored live in Supabase PostgreSQL."
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Supabase Live
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button onClick={fetchZones} variant="outline" size="sm" title="Refresh zones">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Delivery Zone
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

      {/* Main Layout: Map Container + Zone List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container Placeholder (Span 7) */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden p-0 border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800">Geospatial Service Coverage</span>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                {zones.length} Boundaries Loaded
              </span>
            </div>

            {/* Map Placeholder Graphic / Area */}
            <div className="relative h-80 sm:h-96 w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              <div className="relative z-10 max-w-sm space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Compass className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Live Supabase Zones Connected
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Interactive OpenStreetMap Leaflet rendering and customer pin validation connect in Phase 4. All zone polygons are read and written to Supabase PostgreSQL.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    {zones.filter((z) => z.active).length} Active Zones
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    GeoJSON Standard Polygon
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Zone List & Controls (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Configured Zones ({zones.length})</span>
            </h3>
            <span className="text-xs text-slate-500">
              {zones.filter((z) => z.active).length} active
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500">Loading delivery zones...</p>
            </div>
          ) : zones.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No delivery zones found"
              description="No zones exist in your Supabase database. Add one to set up delivery boundaries."
              action={
                <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add First Zone
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <Card key={zone.id} compact className="space-y-3 hover:border-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: zone.color || "#4f46e5" }}
                        />
                        <h4 className="text-sm font-semibold text-slate-900">{zone.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 font-mono text-[11px]">
                        Points: {zone.polygon?.coordinates?.[0]?.length || 0} vertices
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleZoneStatus(zone.id, zone.active, zone.name)}
                        className="text-slate-600 hover:text-indigo-600 transition-colors p-1"
                        title={zone.active ? "Deactivate zone" : "Activate zone"}
                        aria-label={`Toggle active state for ${zone.name}`}
                      >
                        {zone.active ? (
                          <ToggleRight className="h-6 w-6 text-indigo-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteZone(zone.id, zone.name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete zone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-500">
                      Fee: <strong className="text-slate-800">{formatCurrency(zone.delivery_fee)}</strong>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        zone.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {zone.active ? "Dispatching" : "Offline"}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Zone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Delivery Zone (Supabase)"
        description="Insert an operational zone boundary directly into PostgreSQL."
      >
        <form onSubmit={handleCreateZone} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Zone Name"
            placeholder="e.g. West Coast Commercial District"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            disabled={isSaving}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Delivery Fee ($ USD)"
              type="number"
              step="0.50"
              min="0"
              placeholder="3.00"
              value={formFee}
              onChange={(e) => setFormFee(e.target.value)}
              disabled={isSaving}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Display Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  disabled={isSaving}
                  className="h-9 w-12 rounded cursor-pointer border border-slate-300 p-0.5"
                />
                <span className="text-xs font-mono text-slate-600 uppercase">{formColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">GeoJSON Polygon Coordinates [[lng, lat], ...]</label>
            <textarea
              rows={4}
              value={formCoordinates}
              onChange={(e) => setFormCoordinates(e.target.value)}
              disabled={isSaving}
              className="w-full font-mono text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Zone to Supabase
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
