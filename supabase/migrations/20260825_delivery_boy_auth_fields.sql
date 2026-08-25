-- Migration: 20260825_delivery_boy_auth_fields.sql
-- Description: Adds and synchronizes authentication, credential mapping, vehicle, zone, and contact fields for 01_delivery_boys and 01_users.

-- 1. Ensure 01_users has appropriate auth & identity columns
ALTER TABLE public."01_users" 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'rider',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Safely add missing columns to 01_delivery_boys if not present
ALTER TABLE public."01_delivery_boys" 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public."01_users"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
  ADD COLUMN IF NOT EXISTS app_username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS login_password VARCHAR(255) DEFAULT '1234',
  ADD COLUMN IF NOT EXISTS vehicle_info VARCHAR(200),
  ADD COLUMN IF NOT EXISTS zone_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS license_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(50),
  ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public."01_zones"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public."01_vehicles"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'Full Time',
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(30) DEFAULT 'Available',
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS total_deliveries INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS successful_deliveries INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_deliveries INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_latitude NUMERIC(10,7) DEFAULT 26.8467,
  ADD COLUMN IF NOT EXISTS current_longitude NUMERIC(10,7) DEFAULT 80.9462,
  ADD COLUMN IF NOT EXISTS last_location_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS last_location_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS joined_at DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. Indexes for fast lookup by phone, employee_code, user_id and availability
CREATE INDEX IF NOT EXISTS idx_delivery_boys_user_id ON public."01_delivery_boys"(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_employee_code ON public."01_delivery_boys"(employee_code);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_phone ON public."01_delivery_boys"(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_availability ON public."01_delivery_boys"(availability_status);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_zone_id ON public."01_delivery_boys"(zone_id);

-- 4. Enable Row Level Security (RLS) safely
ALTER TABLE public."01_delivery_boys" ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users full access to delivery_boys" ON public."01_delivery_boys";
CREATE POLICY "Allow authenticated users full access to delivery_boys" 
  ON public."01_delivery_boys" 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read-access to delivery_boys" ON public."01_delivery_boys";
CREATE POLICY "Allow anon read-access to delivery_boys" 
  ON public."01_delivery_boys" 
  FOR SELECT 
  TO anon 
  USING (true);
