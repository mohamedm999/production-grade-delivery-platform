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
import DeliveryMapDynamic from "@/components/map/DeliveryMapDynamic";
import { LatLngTuple } from "@/lib/geo/normalize-polygon";
import {
  MapPin,
  Plus,
  Compass,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Layers,
  Trash2,
  RefreshCw,
  Edit3,
  Undo2,
  X,
  Navigation,
  Check,
} from "lucide-react";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DatabaseDeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // Map Mode: "view" | "draw" | "locate"
  const [mapMode, setMapMode] = useState<"view" | "draw" | "locate">("view");
  const [drawingPoints, setDrawingPoints] = useState<LatLngTuple[]>([]);
  const [testedCustomerLocation, setTestedCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Save Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formFee, setFormFee] = useState("3.00");
  const [formColor, setFormColor] = useState("#4f46e5");
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

  // Handle polygon drawing
  const handleAddDrawingPoint = (point: LatLngTuple) => {
    setDrawingPoints((prev) => [...prev, point]);
  };

  const handleUndoPoint = () => {
    setDrawingPoints((prev) => prev.slice(0, -1));
  };

  const handleCancelDrawing = () => {
    setDrawingPoints([]);
    setMapMode("view");
  };

  const handleStartDrawing = () => {
    setDrawingPoints([]);
    setSelectedZoneId(null);
    setTestedCustomerLocation(null);
    setMapMode("draw");
  };

  const handleOpenSaveModal = () => {
    if (drawingPoints.length < 3) {
      alert("A delivery zone polygon requires at least 3 points. Click on the map to add more points.");
      return;
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDrawnZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Zone name is required.");
      return;
    }
    const feeNum = parseFloat(formFee);
    if (isNaN(feeNum) || feeNum < 0) {
      setFormError("Please enter a valid non-negative delivery fee.");
      return;
    }
    if (drawingPoints.length < 3) {
      setFormError("A polygon must have at least 3 vertices.");
      return;
    }

    // Format as array of latitude/longitude pairs as explicitly required:
    // [[lat, lng], [lat, lng], ...]
    const polygonCoordinates = drawingPoints.map(([lat, lng]) => [lat, lng]);

    setIsSaving(true);
    setFormError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("delivery_zones").insert({
        name: formName.trim(),
        delivery_fee: feeNum,
        color: formColor,
        active: true,
        polygon: polygonCoordinates,
      });

      if (error) throw error;

      setIsModalOpen(false);
      setDrawingPoints([]);
      setMapMode("view");
      setFormName("");
      setStatusNotice({ type: "success", message: `Saved zone "${formName}" to Supabase!` });
      await fetchZones();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save zone.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusNotice(null), 4000);
    }
  };

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
      const msg = err instanceof Error ? err.message : "Failed to toggle zone status.";
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
      if (selectedZoneId === id) setSelectedZoneId(null);
      setStatusNotice({ type: "success", message: `Deleted zone "${name}".` });
      setTimeout(() => setStatusNotice(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete zone.";
      setStatusNotice({ type: "error", message: msg });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Delivery Zones & Map"
        description="Interactive OpenStreetMap polygon management and live geofenced zones."
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
            {mapMode === "view" ? (
              <Button onClick={handleStartDrawing} variant="primary" size="sm">
                <Edit3 className="h-4 w-4 mr-1.5" />
                Draw Zone on Map
              </Button>
            ) : mapMode === "draw" ? (
              <Button onClick={handleCancelDrawing} variant="outline" size="sm">
                <X className="h-4 w-4 mr-1.5" />
                Cancel Drawing
              </Button>
            ) : (
              <Button onClick={() => setMapMode("view")} variant="outline" size="sm">
                Return to Zones View
              </Button>
            )}
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

      {/* Mode Switcher Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Map Mode:</span>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => {
                setMapMode("view");
                setDrawingPoints([]);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                mapMode === "view" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Browse Zones
            </button>
            <button
              onClick={handleStartDrawing}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                mapMode === "draw" ? "bg-indigo-600 text-white shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Draw Polygon
            </button>
            <button
              onClick={() => {
                setMapMode("locate");
                setDrawingPoints([]);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                mapMode === "locate" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Test Pin Drop
            </button>
          </div>
        </div>

        {mapMode === "draw" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              {drawingPoints.length} vertices added
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndoPoint}
              disabled={drawingPoints.length === 0}
              className="text-xs h-8 px-2.5"
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Undo
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenSaveModal}
              disabled={drawingPoints.length < 3}
              className="text-xs h-8 px-3"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Finish & Save Zone
            </Button>
          </div>
        )}

        {mapMode === "locate" && testedCustomerLocation && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-mono">
              Pin: {testedCustomerLocation.lat.toFixed(5)}, {testedCustomerLocation.lng.toFixed(5)}
            </span>
            <button
              onClick={() => setTestedCustomerLocation(null)}
              className="text-rose-600 hover:text-rose-700 underline text-xs"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Interactive Map + Delivery Zones List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Leaflet Map Container (Span 7) */}
        <div className="lg:col-span-7">
          <DeliveryMapDynamic
            zones={zones}
            selectedZoneId={selectedZoneId}
            onZoneSelect={(zone) => setSelectedZoneId(zone.id)}
            isDrawing={mapMode === "draw"}
            drawingPoints={drawingPoints}
            onAddDrawingPoint={handleAddDrawingPoint}
            customerLocation={testedCustomerLocation}
            onCustomerLocationChange={setTestedCustomerLocation}
            mode={mapMode}
            className="h-[460px] sm:h-[500px] w-full"
          />
        </div>

        {/* Zones List & Management Panel (Span 5) */}
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
              <span className="text-xs text-slate-500">Loading delivery zones from database...</span>
            </div>
          ) : zones.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No delivery zones configured"
              description="Your database has no delivery boundaries. Click 'Draw Zone on Map' to create one."
              action={
                <Button variant="primary" size="sm" onClick={handleStartDrawing}>
                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                  Draw First Zone
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;

                return (
                  <Card
                    key={zone.id}
                    compact
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`space-y-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500"
                        : "hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: zone.active ? zone.color || "#4f46e5" : "#94a3b8" }}
                          />
                          <h4 className="text-sm font-semibold text-slate-900">{zone.name}</h4>
                        </div>
                        <p className="text-xs text-slate-500">
                          Baseline Fee: <strong className="text-slate-800">{formatCurrency(zone.delivery_fee)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                      <span className="text-slate-400 text-[11px]">
                        {isSelected ? "Selected on Map" : "Click to view on Map"}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          zone.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {zone.active ? "Active" : "Paused / Offline"}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Save Drawn Zone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Save Delivery Zone"
        description={`Saving polygon with ${drawingPoints.length} vertices into Supabase PostgreSQL.`}
      >
        <form onSubmit={handleSaveDrawnZone} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              {formError}
            </div>
          )}

          <Input
            label="Zone Name"
            placeholder="e.g. Downtown Central District"
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

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-1 text-xs">
            <span className="font-semibold text-slate-700 block">Drawn Vertices Preview:</span>
            <div className="font-mono text-[11px] text-slate-600 max-h-24 overflow-y-auto space-y-0.5">
              {drawingPoints.map(([lat, lng], idx) => (
                <div key={idx}>
                  Point {idx + 1}: [{lat.toFixed(5)}, {lng.toFixed(5)}]
                </div>
              ))}
            </div>
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
              Save Delivery Zone
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
