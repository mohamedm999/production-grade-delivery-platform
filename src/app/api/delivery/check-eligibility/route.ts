import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeliveryEligibility } from "@/lib/geo/point-in-polygon";
import { DatabaseDeliveryZone } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { isEligible: false, reason: "Missing or invalid latitude/longitude numbers." },
        { status: 400 }
      );
    }

    // Query active delivery zones from Supabase (authoritative source)
    const supabase = createClient();
    const { data: zones, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("active", true);

    if (error) {
      console.error("Database query error for delivery zones:", error);
      return NextResponse.json(
        { isEligible: false, reason: "Failed to query delivery zones from database." },
        { status: 500 }
      );
    }

    // Run server-side point-in-polygon validation
    const result = validateDeliveryEligibility(lat, lng, (zones as DatabaseDeliveryZone[]) || []);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error during validation.";
    return NextResponse.json({ isEligible: false, reason: message }, { status: 500 });
  }
}
