"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MOCK_DELIVERY_ZONES, DeliveryZone } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
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
  Sparkles,
} from "lucide-react";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>(MOCK_DELIVERY_ZONES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formColor, setFormColor] = useState("#4f46e5");
  const [formDescription, setFormDescription] = useState("");
  const [formArea, setFormArea] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const toggleZoneStatus = (id: string) => {
    setZones((prev) =>
      prev.map((zone) =>
        zone.id === id ? { ...zone, isActive: !zone.isActive } : zone
      )
    );
    const target = zones.find((z) => z.id === id);
    if (target) {
      setSuccessNotice(`Zone "${target.name}" status switched locally.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    }
  };

  const handleCreateZone = (e: React.FormEvent) => {
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

    const newZone: DeliveryZone = {
      id: `zone-local-${Date.now()}`,
      name: formName.trim(),
      deliveryFee: feeNum,
      isActive: true,
      color: formColor,
      polygonPointsCount: 4,
      coverageAreaKm2: parseFloat(formArea) || 12.5,
      description: formDescription.trim() || "Operational delivery polygon zone.",
    };

    setZones((prev) => [...prev, newZone]);
    setIsModalOpen(false);
    setFormName("");
    setFormFee("");
    setFormDescription("");
    setFormArea("");
    setSuccessNotice(`Created new delivery zone "${newZone.name}" in local session.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Delivery Zones"
        description="Configure geofenced boundaries, baseline delivery fees, and active service areas."
        action={
          <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Delivery Zone
          </Button>
        }
      />

      {/* Advisory Banner */}
      <div className="mb-6 rounded-xl bg-slate-100/80 p-3.5 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Planned Map Integration: </span>
          Interactive Leaflet map container and polygon geometry editor will be integrated in Phase 4. Zone toggling works locally below.
        </div>
      </div>

      {successNotice && (
        <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Layout: Map Placeholder + Zone List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container Placeholder (Span 7) */}
        <div className="lg:col-span-7">
          <Card className="overflow-hidden p-0 border-slate-200">
            <div className="border-b border-slate-100 bg-slate-50/75 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-semibold text-slate-800">Geospatial Service Coverage</span>
              </div>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                Phase 4 Roadmap
              </span>
            </div>

            {/* Map Placeholder Graphic / Area */}
            <div className="relative h-80 sm:h-96 w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              {/* Decorative subtle grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Decorative zone boundary preview mock */}
              <div className="absolute inset-10 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 flex items-center justify-center pointer-events-none">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-[10px] text-emerald-300">
                  Zone Polygon Overlay Simulation
                </div>
              </div>

              <div className="relative z-10 max-w-sm space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Compass className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Interactive Leaflet Map Area
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    OpenStreetMap vector tiles, interactive zone polygon rendering, and customer coordinate pins connect in Phase 4.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    4 Polygon Boundaries Loaded
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                    PostGIS Ray-Casting Ready
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
              {zones.filter((z) => z.isActive).length} active
            </span>
          </div>

          <div className="space-y-3">
            {zones.map((zone) => (
              <Card key={zone.id} compact className="space-y-3 hover:border-slate-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: zone.color }}
                      />
                      <h4 className="text-sm font-semibold text-slate-900">{zone.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{zone.description}</p>
                  </div>
                  <button
                    onClick={() => toggleZoneStatus(zone.id)}
                    className="shrink-0 text-slate-600 hover:text-indigo-600 transition-colors p-1"
                    title={zone.isActive ? "Deactivate zone" : "Activate zone"}
                    aria-label={`Toggle active state for ${zone.name}`}
                  >
                    {zone.isActive ? (
                      <ToggleRight className="h-6 w-6 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-500">
                    Fee: <strong className="text-slate-800">{formatCurrency(zone.deliveryFee)}</strong>
                  </div>
                  <div className="text-slate-500">
                    Coverage: <span className="font-medium text-slate-700">{zone.coverageAreaKm2} km²</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      zone.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}
                  >
                    {zone.isActive ? "Dispatching" : "Offline"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Add Zone Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Configure Delivery Zone"
        description="Add operational zone boundaries and delivery surcharge."
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
              required
            />

            <Input
              label="Approx. Area (km²)"
              type="number"
              placeholder="15.0"
              value={formArea}
              onChange={(e) => setFormArea(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Display Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-slate-300 p-0.5"
              />
              <span className="text-xs font-mono text-slate-600 uppercase">{formColor}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Service Notes</label>
            <textarea
              rows={2}
              placeholder="Special dispatch instructions or traffic considerations..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Zone Definition
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
