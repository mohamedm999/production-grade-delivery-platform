-- ==============================================================================
-- SWIFTDISPATCH PLATFORM: FIX RLS POLICIES & AUTO-CONFIRM ACCOUNTS
-- Migration: 20261023000001_fix_rls_and_confirm_email.sql
-- ==============================================================================

BEGIN;

-- 1. Auto-confirm all users in auth.users so staff can immediately log in
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 2. PRODUCTS: Allow public read + authenticated/anon write access
DROP POLICY IF EXISTS "Authenticated users can select products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public manage products" ON public.products;

CREATE POLICY "Allow public read products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert products"
  ON public.products
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update products"
  ON public.products
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete products"
  ON public.products
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 3. DELIVERY ZONES: Allow public read + manage
DROP POLICY IF EXISTS "Authenticated users can select delivery zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Authenticated users can insert delivery zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Authenticated users can update delivery zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Authenticated users can delete delivery zones" ON public.delivery_zones;

CREATE POLICY "Allow public read delivery zones"
  ON public.delivery_zones
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert delivery zones"
  ON public.delivery_zones
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update delivery zones"
  ON public.delivery_zones
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete delivery zones"
  ON public.delivery_zones
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. ORDERS: Allow public read + manage
DROP POLICY IF EXISTS "Authenticated users can select orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Allow public read orders"
  ON public.orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert orders"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update orders"
  ON public.orders
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. ORDER ITEMS: Allow public read + manage
DROP POLICY IF EXISTS "Authenticated users can select order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order items" ON public.order_items;

CREATE POLICY "Allow public read order items"
  ON public.order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert order items"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Seed default products if empty
INSERT INTO public.products (id, name, description, price, stock, category, is_available)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Artisan Sourdough Loaf', 'Naturally fermented rustic loaf with crisp crust.', 6.50, 40, 'Bakery', true),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Cold Brew Reserve (1L)', 'Slow-steeped Ethiopian single-origin coffee.', 12.00, 25, 'Beverages', true),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Organic Hass Avocados (Pack of 4)', 'Farm-fresh ripe avocados.', 7.99, 50, 'Produce', true),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Wildflower Honeycomb (300g)', 'Pure raw honeycomb from mountain apiaries.', 15.50, 15, 'Pantry', false),
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Cold-Pressed Olive Oil (500ml)', 'Extra virgin cold-pressed olive oil.', 18.00, 30, 'Pantry', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Seed default delivery zones if empty
INSERT INTO public.delivery_zones (id, name, polygon, active, delivery_fee, color)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Downtown / Central District',
    '{"type": "Polygon", "coordinates": [[[-7.6300, 33.6000], [-7.5900, 33.6000], [-7.5900, 33.5750], [-7.6300, 33.5750], [-7.6300, 33.6000]]]}'::jsonb,
    true,
    2.50,
    '#4f46e5'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'North Residential Sector',
    '{"type": "Polygon", "coordinates": [[[-7.6100, 33.6300], [-7.5700, 33.6300], [-7.5700, 33.6050], [-7.6100, 33.6050], [-7.6100, 33.6300]]]}'::jsonb,
    true,
    4.00,
    '#059669'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;
