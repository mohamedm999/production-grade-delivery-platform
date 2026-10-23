"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { DatabaseDeliveryZone } from "@/lib/types/database";
import { normalizePolygon, LatLngTuple, getPolygonCenter } from "@/lib/geo/normalize-polygon";
import { formatCurrency } from "@/lib/utils";
import { MapPin, Navigation, Compass, AlertTriangle, Layers } from "lucide-react";

// Fix Leaflet's default marker icons for bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom crisp SVG pins that never fail to bundle
const customerPinIcon = L.divIcon({
  className: "custom-pin-marker",
  html: `
    <div style="position: relative; width: 32px; height: 32px; transform: translate(-50%, -100%);">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#4f46e5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="#ffffff"/>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const vertexPointIcon = L.divIcon({
  className: "custom-pin-marker",
  html: `
    <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #6366f1; border: 2.5px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3); transform: translate(-50%, -50%);"></div>
  `,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

export interface DeliveryMapProps {
  zones: DatabaseDeliveryZone[];
  selectedZoneId?: string | null;
  onZoneSelect?: (zone: DatabaseDeliveryZone) => void;
  isDrawing?: boolean;
  drawingPoints?: LatLngTuple[];
  onAddDrawingPoint?: (point: LatLngTuple) => void;
  customerLocation?: { lat: number; lng: number } | null;
  onCustomerLocationChange?: (coords: { lat: number; lng: number } | null) => void;
  mode?: "view" | "draw" | "locate";
  className?: string;
}

// Controller component to handle map click events based on mode
function MapEventsHandler({
  mode,
  isDrawing,
  onAddDrawingPoint,
  onCustomerLocationChange,
}: {
  mode: "view" | "draw" | "locate";
  isDrawing?: boolean;
  onAddDrawingPoint?: (point: LatLngTuple) => void;
  onCustomerLocationChange?: (coords: { lat: number; lng: number } | null) => void;
}) {
  useMapEvents({
    click(e) {
      if (mode === "draw" || isDrawing) {
        onAddDrawingPoint?.([e.latlng.lat, e.latlng.lng]);
      } else if (mode === "locate" || onCustomerLocationChange) {
        onCustomerLocationChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Map center synchronizer
function MapCenterController({ center }: { center: LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1 });
  }, [center, map]);
  return null;
}

export default function DeliveryMap({
  zones,
  selectedZoneId,
  onZoneSelect,
  isDrawing = false,
  drawingPoints = [],
  onAddDrawingPoint,
  customerLocation,
  onCustomerLocationChange,
  mode = "view",
  className = "h-[450px] w-full",
}: DeliveryMapProps) {
  // Determine default initial center
  const defaultCenter = useMemo<LatLngTuple>(() => {
    if (customerLocation) {
      return [customerLocation.lat, customerLocation.lng];
    }
    for (const zone of zones) {
      const normalized = normalizePolygon(zone.polygon);
      if (normalized && normalized.length > 0) {
        return getPolygonCenter(normalized);
      }
    }
    return [33.5731, -7.5898]; // Default central city coordinate (Casablanca core)
  }, [customerLocation, zones]);

  // Selected zone center if selected
  const activeSelectedCenter = useMemo<LatLngTuple | null>(() => {
    if (!selectedZoneId) return null;
    const target = zones.find((z) => z.id === selectedZoneId);
    if (!target) return null;
    const normalized = normalizePolygon(target.polygon);
    return normalized ? getPolygonCenter(normalized) : null;
  }, [selectedZoneId, zones]);

  const [tileError, setTileError] = useState(false);

  const isLocateMode = mode === "locate";
  const isDrawMode = mode === "draw" || isDrawing;
  const isViewMode = !isLocateMode && !isDrawMode;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 ${className}`}>
      {/* Mode Status Pill Overlay */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 shadow-md border border-slate-200 text-xs font-semibold backdrop-blur-sm pointer-events-auto">
        {mode === "draw" || isDrawing ? (
          <span className="flex items-center gap-1.5 text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Drawing Mode: Click map to place points ({drawingPoints.length})
          </span>
        ) : mode === "locate" ? (
          <span className="flex items-center gap-1.5 text-emerald-700">
            <Navigation className="h-3.5 w-3.5 text-emerald-600" />
            Click map to drop customer delivery pin
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-700">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            {zones.filter((z) => z.active).length} Active Zones
          </span>
        )}
      </div>

      {tileError && (
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800 border border-amber-200 shadow-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Map tiles loading slowly. Offline mode active.</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{
          cursor: isDrawing || mode === "draw" ? "crosshair" : mode === "locate" ? "pointer" : "grab",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            load: () => setTileError(false),
          }}
        />

        {activeSelectedCenter && <MapCenterController center={activeSelectedCenter} />}

        <MapEventsHandler
          mode={mode}
          isDrawing={isDrawing}
          onAddDrawingPoint={onAddDrawingPoint}
          onCustomerLocationChange={onCustomerLocationChange}
        />

        {/* Render Saved Supabase Delivery Zones */}
        {zones.map((zone) => {
          const coords = normalizePolygon(zone.polygon);
          if (!coords) return null;

          const isSelected = selectedZoneId === zone.id;
          const color = zone.color || "#4f46e5";

          return (
            <Polygon
              key={zone.id}
              positions={coords}
              pathOptions={{
                color: zone.active ? color : "#64748b",
                fillColor: zone.active ? color : "#94a3b8",
                fillOpacity: isSelected ? 0.45 : zone.active ? 0.25 : 0.12,
                weight: isSelected ? 3.5 : zone.active ? 2 : 1.5,
                dashArray: zone.active ? undefined : "6, 6",
              }}
              eventHandlers={{
                click: (e) => {
                  if (isLocateMode && onCustomerLocationChange) {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    onCustomerLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
                  } else if (isDrawMode && onAddDrawingPoint) {
                    L.DomEvent.stopPropagation(e.originalEvent);
                    onAddDrawingPoint([e.latlng.lat, e.latlng.lng]);
                  } else if (isViewMode) {
                    onZoneSelect?.(zone);
                  }
                },
              }}
            >
              {isViewMode && (
                <Popup>
                  <div className="text-xs space-y-1 p-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: zone.active ? color : "#94a3b8" }}
                      />
                      <span>{zone.name}</span>
                    </div>
                    <div className="text-slate-600">
                      Delivery Fee: <strong>{formatCurrency(zone.delivery_fee)}</strong>
                    </div>
                    <div className="text-[11px] font-medium">
                      Status:{" "}
                      <span className={zone.active ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                        {zone.active ? "Active" : "Paused / Offline"}
                      </span>
                    </div>
                  </div>
                </Popup>
              )}
            </Polygon>
          );
        })}

        {/* Live Drawing Preview */}
        {(isDrawing || mode === "draw") && drawingPoints.length > 0 && (
          <>
            {/* Markers at each placed vertex */}
            {drawingPoints.map((point, index) => (
              <Marker key={`vertex-${index}`} position={point} icon={vertexPointIcon} />
            ))}

            {/* Connecting lines or closed preview polygon */}
            {drawingPoints.length >= 3 ? (
              <Polygon
                positions={drawingPoints}
                pathOptions={{
                  color: "#4f46e5",
                  fillColor: "#6366f1",
                  fillOpacity: 0.35,
                  weight: 2.5,
                  dashArray: "4, 4",
                }}
              />
            ) : (
              <Polyline
                positions={drawingPoints}
                pathOptions={{
                  color: "#4f46e5",
                  weight: 2.5,
                  dashArray: "4, 4",
                }}
              />
            )}
          </>
        )}

        {/* Customer Location Pin */}
        {customerLocation && (
          <Marker
            position={[customerLocation.lat, customerLocation.lng]}
            icon={customerPinIcon}
            draggable={isLocateMode}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const position = marker.getLatLng();
                onCustomerLocationChange?.({ lat: position.lat, lng: position.lng });
              },
            }}
          >
            <Popup>
              <div className="text-xs space-y-1 p-0.5">
                <span className="font-semibold text-slate-900 block">Customer Destination</span>
                <span className="text-[11px] font-mono text-slate-600 block">
                  {customerLocation.lat.toFixed(5)}, {customerLocation.lng.toFixed(5)}
                </span>
                {isLocateMode && (
                  <span className="text-[10px] text-indigo-600 block font-medium">
                    Drag pin to fine-tune location
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
