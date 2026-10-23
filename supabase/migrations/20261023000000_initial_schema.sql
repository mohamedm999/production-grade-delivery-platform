-- ==============================================================================
-- SWIFTDISPATCH PLATFORM: INITIAL DATABASE MIGRATION
-- Migration Version: 20261023000000_initial_schema.sql
-- Description: Core tables, RLS policies, automatic triggers, and account provisioning
-- ==============================================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & CONSTRAINTS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status_enum AS ENUM ('pending', 'validated', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLE: profiles
-- Linked 1-to-1 with Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. TABLE: products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category TEXT DEFAULT 'General',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(is_available);

CREATE TRIGGER update_products_modtime
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. TABLE: delivery_zones
-- Documented polygon JSONB format:
-- GeoJSON Polygon: { "type": "Polygon", "coordinates": [[[lng, lat], [lng, lat], ...]] }
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  polygon JSONB NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
  color TEXT DEFAULT '#4f46e5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON public.delivery_zones(active);

CREATE TRIGGER update_delivery_zones_modtime
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. TABLE: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected')),
  zone_id UUID REFERENCES public.delivery_zones(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_zone_id ON public.orders(zone_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER update_orders_modtime
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. TABLE: order_items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Security helper: Fetch current user's role without recursive policy lookup
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES POLICIES
-- Authenticated users can view profiles
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile, but CANNOT escalate their own role
CREATE POLICY "Users can update own profile name only"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- PRODUCTS POLICIES
-- Authenticated staff/admin have full read and write access
CREATE POLICY "Authenticated users can select products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (true);

-- DELIVERY ZONES POLICIES
-- Authenticated staff can view and manage zones
CREATE POLICY "Authenticated users can select delivery zones"
  ON public.delivery_zones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert delivery zones"
  ON public.delivery_zones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update delivery zones"
  ON public.delivery_zones
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete delivery zones"
  ON public.delivery_zones
  FOR DELETE
  TO authenticated
  USING (true);

-- ORDERS POLICIES
-- Authenticated staff can view and update orders
CREATE POLICY "Authenticated users can select orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ORDER ITEMS POLICIES
CREATE POLICY "Authenticated users can select order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert order items"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================================================
-- 10. AUTOMATIC ACCOUNT PROVISIONING TRIGGER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'staff' -- Initial safe default. Admin escalation must be performed by authorized admin or dashboard.
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 11. SEED DATA (For Immediate Verification)
-- ==============================================================================

-- Seed Products
INSERT INTO public.products (id, name, description, price, stock, category, is_available)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Artisan Sourdough Loaf', 'Naturally fermented rustic loaf with crisp crust.', 6.50, 40, 'Bakery', true),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Cold Brew Reserve (1L)', 'Slow-steeped Ethiopian single-origin coffee.', 12.00, 25, 'Beverages', true),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Organic Hass Avocados (Pack of 4)', 'Farm-fresh ripe avocados.', 7.99, 50, 'Produce', true),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wildflower Honeycomb (300g)', 'Pure raw honeycomb from mountain apiaries.', 15.50, 15, 'Pantry', false),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Cold-Pressed Olive Oil (500ml)', 'Extra virgin cold-pressed olive oil.', 18.00, 30, 'Pantry', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Delivery Zones with documented GeoJSON polygon coordinates
INSERT INTO public.delivery_zones (id, name, polygon, active, delivery_fee, color)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Downtown / Central District',
    '{
      "type": "Polygon",
      "coordinates": [
        [
          [-7.6300, 33.6000],
          [-7.5900, 33.6000],
          [-7.5900, 33.5750],
          [-7.6300, 33.5750],
          [-7.6300, 33.6000]
        ]
      ]
    }'::jsonb,
    true,
    2.50,
    '#4f46e5'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'North Residential Sector',
    '{
      "type": "Polygon",
      "coordinates": [
        [
          [-7.6100, 33.6300],
          [-7.5700, 33.6300],
          [-7.5700, 33.6050],
          [-7.6100, 33.6050],
          [-7.6100, 33.6300]
        ]
      ]
    }'::jsonb,
    true,
    4.00,
    '#059669'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Harbor & Marina Promenade',
    '{
      "type": "Polygon",
      "coordinates": [
        [
          [-7.6500, 33.6150],
          [-7.6250, 33.6150],
          [-7.6250, 33.5950],
          [-7.6500, 33.5950],
          [-7.6500, 33.6150]
        ]
      ]
    }'::jsonb,
    false,
    5.50,
    '#d97706'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
