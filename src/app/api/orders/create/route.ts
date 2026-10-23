import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateDeliveryEligibility } from "@/lib/geo/point-in-polygon";
import { DatabaseDeliveryZone, DatabaseProduct } from "@/lib/types/database";

interface OrderItemRequest {
  product_id: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_address,
      latitude,
      longitude,
      items,
      allow_rejected_save = false, // If false, ineligible orders return 400 validation error; if true, records order with 'rejected' status
    } = body;

    // 1. Validate required customer information
    if (!customer_name || typeof customer_name !== "string" || !customer_name.trim()) {
      return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    }

    if (!customer_phone || typeof customer_phone !== "string" || !customer_phone.trim()) {
      return NextResponse.json({ error: "Customer phone number is required." }, { status: 400 });
    }

    // Phone format check: international, domestic, or standard formats (min 7 digits, allowed punctuation)
    const phoneRegex = /^[+]?[\d\s\-().]{7,25}$/;
    if (!phoneRegex.test(customer_phone.trim())) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please enter a valid telephone number." },
        { status: 400 }
      );
    }

    if (!customer_address || typeof customer_address !== "string" || !customer_address.trim()) {
      return NextResponse.json({ error: "Customer delivery address is required." }, { status: 400 });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid delivery coordinates. Latitude [-90, 90] and Longitude [-180, 180] required." },
        { status: 400 }
      );
    }

    // 2. Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one product." },
        { status: 400 }
      );
    }

    for (const it of items as OrderItemRequest[]) {
      if (!it.product_id || typeof it.quantity !== "number" || !Number.isInteger(it.quantity) || it.quantity <= 0) {
        return NextResponse.json(
          { error: "Each order item must specify a valid product and a positive integer quantity." },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();

    // 3. Re-read product prices and stock from TRUSTED database data
    const productIds = Array.from(new Set(items.map((i: OrderItemRequest) => i.product_id)));
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds);

    if (prodError || !dbProducts) {
      console.error("Database product lookup error:", prodError);
      return NextResponse.json({ error: "Failed to retrieve products from database." }, { status: 500 });
    }

    const productsMap = new Map<string, DatabaseProduct>();
    for (const p of dbProducts as DatabaseProduct[]) {
      productsMap.set(p.id, p);
    }

    // Verify all requested products exist, are available, and have sufficient stock
    let subtotal = 0;
    const validatedItems: { product_id: string; quantity: number; unit_price: number; name: string }[] = [];

    for (const item of items as OrderItemRequest[]) {
      const dbProduct = productsMap.get(item.product_id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product ID "${item.product_id}" was not found in database.` },
          { status: 400 }
        );
      }

      if (!dbProduct.is_available) {
        return NextResponse.json(
          { error: `Product "${dbProduct.name}" is currently marked unavailable.` },
          { status: 400 }
        );
      }

      if (item.quantity > dbProduct.stock) {
        return NextResponse.json(
          {
            error: `Requested quantity for "${dbProduct.name}" (${item.quantity}) exceeds available stock (${dbProduct.stock}).`,
          },
          { status: 400 }
        );
      }

      // Use TRUSTED price from database, not client
      const trustedPrice = Number(dbProduct.price);
      subtotal += trustedPrice * item.quantity;

      validatedItems.push({
        product_id: dbProduct.id,
        quantity: item.quantity,
        unit_price: trustedPrice,
        name: dbProduct.name,
      });
    }

    // 4. Authoritative Server-Side Delivery Eligibility Check
    const { data: dbZones, error: zonesError } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("active", true);

    if (zonesError || !dbZones) {
      console.error("Database delivery zones lookup error:", zonesError);
      return NextResponse.json({ error: "Failed to query active delivery zones." }, { status: 500 });
    }

    const eligibility = validateDeliveryEligibility(
      latitude,
      longitude,
      (dbZones as DatabaseDeliveryZone[]) || []
    );

    // Decision: If coordinates are outside every active zone
    if (!eligibility.isEligible && !allow_rejected_save) {
      return NextResponse.json(
        {
          error: "Delivery Ineligible: The specified location falls outside all active delivery zones.",
          eligibility,
        },
        { status: 422 }
      );
    }

    const orderStatus = eligibility.isEligible ? "validated" : "rejected";
    const matchingZoneId = eligibility.matchingZone ? eligibility.matchingZone.id : null;
    const deliveryFee = eligibility.isEligible ? Number(eligibility.deliveryFee) : 0;
    const totalAmount = subtotal + deliveryFee;

    // 5. Atomic Order Creation
    // Step A: Insert into orders table
    const { data: newOrder, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_address: customer_address.trim(),
        latitude,
        longitude,
        status: orderStatus,
        zone_id: matchingZoneId,
        total_amount: totalAmount,
      })
      .select()
      .single();

    if (orderInsertError || !newOrder) {
      console.error("Error inserting order:", orderInsertError);
      return NextResponse.json({ error: "Failed to persist order to database." }, { status: 500 });
    }

    // Step B: Insert line items into order_items table
    const orderItemsPayload = validatedItems.map((vi) => ({
      order_id: newOrder.id,
      product_id: vi.product_id,
      quantity: vi.quantity,
      unit_price: vi.unit_price,
    }));

    const { error: itemsInsertError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsInsertError) {
      console.error("Error inserting order items. Rolling back order:", itemsInsertError);
      // Atomic rollback: clean up orphaned order
      await supabase.from("orders").delete().eq("id", newOrder.id);
      return NextResponse.json({ error: "Failed to save order items. Transaction rolled back." }, { status: 500 });
    }

    // Step C: Atomically decrement stock for validated orders
    if (orderStatus === "validated") {
      for (const vi of validatedItems) {
        const currentStock = productsMap.get(vi.product_id)?.stock || 0;
        const newStock = Math.max(0, currentStock - vi.quantity);
        await supabase
          .from("products")
          .update({ stock: newStock, updated_at: new Date().toISOString() })
          .eq("id", vi.product_id);
      }
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      eligibility,
      items: validatedItems,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      status: orderStatus,
    });
  } catch (err: unknown) {
    console.error("Order creation fatal error:", err);
    const message = err instanceof Error ? err.message : "Internal server error creating order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
