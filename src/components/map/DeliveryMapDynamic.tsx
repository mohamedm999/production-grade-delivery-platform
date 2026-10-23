"use client";

import dynamic from "next/dynamic";
import { Loader2, Map } from "lucide-react";
import type { DeliveryMapProps } from "./DeliveryMap";

const DynamicMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500">
      <div className="flex items-center gap-2 mb-2">
        <Map className="h-5 w-5 text-indigo-600 animate-pulse" />
        <span className="text-sm font-semibold text-slate-800">Initializing OpenStreetMap...</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        <span>Loading map tiles & vector polygon overlays</span>
      </div>
    </div>
  ),
});

export default function DeliveryMapDynamic(props: DeliveryMapProps) {
  return <DynamicMap {...props} />;
}
