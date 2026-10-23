"use client";

import React from "react";
import DeliveryMapDynamic from "./DeliveryMapDynamic";
import { DatabaseDeliveryZone } from "@/lib/types/database";
import { Button } from "@/components/ui/Button";
import { MapPin, X, Navigation } from "lucide-react";

export interface LocationPickerProps {
  zones: DatabaseDeliveryZone[];
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number } | null) => void;
  className?: string;
  label?: string;
  helperText?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  zones,
  value,
  onChange,
  className,
  label = "Select Delivery Destination",
  helperText = "Click anywhere on the map to place your delivery pin.",
}) => {
  return (
    <div className={`space-y-3 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
        </div>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-7 px-2"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear Pin
          </Button>
        )}
      </div>

      {/* Coordinate Readout */}
      {value ? (
        <div className="flex items-center justify-between rounded-lg bg-indigo-50/80 px-3 py-2 border border-indigo-200 text-xs">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-indigo-950">Pinned Coordinates:</span>
            <span className="font-mono text-indigo-800">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </span>
          </div>
          <span className="text-[10px] font-medium text-indigo-700 bg-white/80 px-2 py-0.5 rounded border border-indigo-200">
            Pin Placed
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 text-xs text-slate-500 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>No destination pinned yet. Click on the map within an active delivery zone.</span>
        </div>
      )}

      {/* Interactive Map */}
      <DeliveryMapDynamic
        zones={zones}
        mode="locate"
        customerLocation={value}
        onCustomerLocationChange={onChange}
        className="h-80 sm:h-96 w-full"
      />
    </div>
  );
};
