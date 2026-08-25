-- ==============================================================================
-- HARIBANSHO DELIVERY APP - COMPLETE SUPABASE POSTGRESQL SCHEMA
-- All custom tables start strictly with "01_" prefix as required
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public."01_users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL DEFAULT 'Admin@123',
  phone VARCHAR(20),
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  role VARCHAR(50) NOT NULL DEFAULT 'dispatcher',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. USER ROLES
CREATE TABLE IF NOT EXISTS public."01_user_roles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER ROLE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public."01_user_role_assignments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public."01_users"(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public."01_user_roles"(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public."01_users"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS public."01_customers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  profile_image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public."01_customer_addresses" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public."01_customers"(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  landmark VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PRODUCTS & STOCK
CREATE TABLE IF NOT EXISTS public."01_products" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  category_name VARCHAR(100) NOT NULL DEFAULT 'Grocery',
  sku VARCHAR(100) UNIQUE NOT NULL,
  barcode VARCHAR(100),
  unit VARCHAR(50) NOT NULL DEFAULT 'piece',
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  image_url TEXT,
  quantity_available INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. INVENTORY
CREATE TABLE IF NOT EXISTS public."01_inventory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public."01_products"(id) ON DELETE CASCADE,
  quantity_available INT NOT NULL DEFAULT 0,
  quantity_reserved INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 10,
  warehouse_name VARCHAR(100) NOT NULL DEFAULT 'Main Hub',
  updated_by UUID REFERENCES public."01_users"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ZONES
CREATE TABLE IF NOT EXISTS public."01_zones" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  zone_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL DEFAULT 'Lucknow',
  state VARCHAR(100) NOT NULL DEFAULT 'Uttar Pradesh',
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  center_lat NUMERIC(10,7) NOT NULL DEFAULT 26.8467,
  center_lng NUMERIC(10,7) NOT NULL DEFAULT 80.9462,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. LOCATIONS
CREATE TABLE IF NOT EXISTS public."01_locations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public."01_zones"(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. VEHICLES
CREATE TABLE IF NOT EXISTS public."01_vehicles" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL CHECK (vehicle_type IN ('Bike', 'Scooter', 'Bicycle', 'Car', 'Van', 'Truck')),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  fuel_type VARCHAR(20) NOT NULL DEFAULT 'Petrol',
  capacity VARCHAR(50) NOT NULL DEFAULT '20 kg',
  assigned_delivery_boy_id UUID,
  registration_expiry DATE,
  insurance_expiry DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DELIVERY BOYS
CREATE TABLE IF NOT EXISTS public."01_delivery_boys" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public."01_users"(id) ON DELETE SET NULL,
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  profile_image_url TEXT,
  zone_id UUID REFERENCES public."01_zones"(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public."01_vehicles"(id) ON DELETE SET NULL,
  employment_status VARCHAR(50) NOT NULL DEFAULT 'Full Time',
  availability_status VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (availability_status IN ('Available', 'Busy', 'Offline', 'On Break')),
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_deliveries INT NOT NULL DEFAULT 0,
  successful_deliveries INT NOT NULL DEFAULT 0,
  cancelled_deliveries INT NOT NULL DEFAULT 0,
  current_latitude NUMERIC(10,7) DEFAULT 26.8467,
  current_longitude NUMERIC(10,7) DEFAULT 80.9462,
  last_location_name VARCHAR(200),
  last_location_at TIMESTAMPTZ,
  joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. ORDERS
CREATE TABLE IF NOT EXISTS public."01_orders" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public."01_customers"(id) ON DELETE RESTRICT,
  delivery_address_id UUID NOT NULL REFERENCES public."01_customer_addresses"(id) ON DELETE RESTRICT,
  zone_id UUID REFERENCES public."01_zones"(id) ON DELETE SET NULL,
  order_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Assigned', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Failed')),
  assignment_status VARCHAR(30) NOT NULL DEFAULT 'Unassigned' CHECK (assignment_status IN ('Unassigned', 'Assigned', 'Accepted', 'On The Way', 'Delivered', 'Failed')),
  assigned_delivery_boy_id UUID REFERENCES public."01_delivery_boys"(id) ON DELETE SET NULL,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'COD Pending', 'COD Collected', 'Refunded', 'Failed')),
  payment_method VARCHAR(30) NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD', 'Online', 'Card', 'UPI', 'Wallet')),
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 40.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cod_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  scheduled_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  customer_notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES public."01_users"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public."01_order_items" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public."01_products"(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS public."01_order_status_history" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  previous_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES public."01_users"(id),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. DELIVERY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public."01_delivery_assignments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public."01_delivery_boys"(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public."01_users"(id),
  assignment_status VARCHAR(30) NOT NULL DEFAULT 'Assigned' CHECK (assignment_status IN ('Assigned', 'Accepted', 'Rejected', 'Picked Up', 'On The Way', 'Delivered', 'Failed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. DELIVERY TRACKING
CREATE TABLE IF NOT EXISTS public."01_delivery_tracking" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public."01_delivery_boys"(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  accuracy NUMERIC(8,2),
  speed NUMERIC(6,2),
  heading NUMERIC(6,2),
  location_name VARCHAR(255),
  tracking_status VARCHAR(50) NOT NULL DEFAULT 'Active',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. DELIVERY TRACKING HISTORY
CREATE TABLE IF NOT EXISTS public."01_delivery_tracking_history" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  delivery_boy_id UUID NOT NULL REFERENCES public."01_delivery_boys"(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_message TEXT NOT NULL,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. PAYMENTS
CREATE TABLE IF NOT EXISTS public."01_payments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public."01_customers"(id) ON DELETE RESTRICT,
  payment_method VARCHAR(30) NOT NULL DEFAULT 'COD',
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(30) NOT NULL DEFAULT 'Paid',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. COD SETTLEMENTS
CREATE TABLE IF NOT EXISTS public."01_cod_settlements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_boy_id UUID NOT NULL REFERENCES public."01_delivery_boys"(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  amount_collected NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  settlement_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (settlement_status IN ('Pending', 'Settled', 'Disputed')),
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ,
  settled_by UUID REFERENCES public."01_users"(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 21. RETURNS
CREATE TABLE IF NOT EXISTS public."01_returns" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public."01_customers"(id) ON DELETE RESTRICT,
  delivery_boy_id UUID REFERENCES public."01_delivery_boys"(id),
  return_reason TEXT NOT NULL,
  return_status VARCHAR(30) NOT NULL DEFAULT 'Requested' CHECK (return_status IN ('Requested', 'Approved', 'Picked Up', 'Completed', 'Rejected')),
  return_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  approved_by UUID REFERENCES public."01_users"(id),
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 22. CANCELLATIONS
CREATE TABLE IF NOT EXISTS public."01_cancellations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public."01_orders"(id) ON DELETE CASCADE,
  cancelled_by UUID REFERENCES public."01_users"(id),
  cancellation_type VARCHAR(50) NOT NULL DEFAULT 'Customer',
  reason TEXT NOT NULL,
  refund_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  cancelled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 23. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public."01_notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public."01_users"(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL DEFAULT 'Order',
  entity_type VARCHAR(50),
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 24. OFFERS
CREATE TABLE IF NOT EXISTS public."01_offers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  minimum_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  maximum_discount_amount NUMERIC(10,2),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '30 days',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 25. COUPONS
CREATE TABLE IF NOT EXISTS public."01_coupons" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  minimum_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  maximum_discount_amount NUMERIC(10,2),
  usage_limit INT NOT NULL DEFAULT 1000,
  usage_count INT NOT NULL DEFAULT 0,
  per_customer_limit INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '60 days',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 26. APP SETTINGS
CREATE TABLE IF NOT EXISTS public."01_app_settings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  setting_group VARCHAR(50) NOT NULL DEFAULT 'General',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public."01_users"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and create open permissive policies for all tables (admin & anon dashboard access)
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    '01_users', '01_user_roles', '01_user_role_assignments',
    '01_customers', '01_customer_addresses',
    '01_products', '01_inventory',
    '01_zones', '01_locations', '01_vehicles', '01_delivery_boys',
    '01_orders', '01_order_items', '01_order_status_history',
    '01_delivery_assignments', '01_delivery_tracking', '01_delivery_tracking_history',
    '01_payments', '01_cod_settlements', '01_returns', '01_cancellations',
    '01_notifications', '01_offers', '01_coupons',
    '01_app_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Allow_All_Access_' || tbl, tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', 'Allow_All_Access_' || tbl, tbl);
  END LOOP;
END $$;
