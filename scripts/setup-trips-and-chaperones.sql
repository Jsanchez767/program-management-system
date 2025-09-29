-- =============================================
-- TRIPS AND CHAPERONES SETUP SCRIPT
-- =============================================
-- This script sets up the complete database schema for trips management
-- with multi-tenant support and Row Level Security (RLS)

-- Step 1: Create trips table
-- =============================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    destination TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_participants INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'draft',
    admin_comments TEXT DEFAULT '',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create chaperones table
-- =============================================
CREATE TABLE IF NOT EXISTS chaperones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique staff per trip
    UNIQUE(trip_id, staff_id)
);

-- Step 3: Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_trips_organization_id ON trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);
CREATE INDEX IF NOT EXISTS idx_chaperones_trip_id ON chaperones(trip_id);
CREATE INDEX IF NOT EXISTS idx_chaperones_staff_id ON chaperones(staff_id);
CREATE INDEX IF NOT EXISTS idx_chaperones_organization_id ON chaperones(organization_id);

-- Step 4: Add updated_at trigger for trips
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE chaperones ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for trips table
-- =============================================

-- Policy: Users can see trips from their organization
DROP POLICY IF EXISTS "Users can view trips from their organization" ON trips;
CREATE POLICY "Users can view trips from their organization" ON trips
    FOR SELECT USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
    );

-- Policy: Admins can insert trips
DROP POLICY IF EXISTS "Admins can insert trips" ON trips;
CREATE POLICY "Admins can insert trips" ON trips
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Policy: Admins can update trips
DROP POLICY IF EXISTS "Admins can update trips" ON trips;
CREATE POLICY "Admins can update trips" ON trips
    FOR UPDATE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Policy: Admins can delete trips
DROP POLICY IF EXISTS "Admins can delete trips" ON trips;
CREATE POLICY "Admins can delete trips" ON trips
    FOR DELETE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Step 7: Create RLS policies for chaperones table
-- =============================================

-- Policy: Users can see chaperones from their organization
DROP POLICY IF EXISTS "Users can view chaperones from their organization" ON chaperones;
CREATE POLICY "Users can view chaperones from their organization" ON chaperones
    FOR SELECT USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
    );

-- Policy: Staff and admins can insert chaperones
DROP POLICY IF EXISTS "Staff and admins can insert chaperones" ON chaperones;
CREATE POLICY "Staff and admins can insert chaperones" ON chaperones
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'instructor')
    );

-- Policy: Staff and admins can delete chaperones
DROP POLICY IF EXISTS "Staff and admins can delete chaperones" ON chaperones;
CREATE POLICY "Staff and admins can delete chaperones" ON chaperones
    FOR DELETE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'instructor')
    );

-- Step 8: Update database types (for TypeScript)
-- =============================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS public.Trip CASCADE;
DROP TYPE IF EXISTS public.Chaperone CASCADE;

-- Create TypeScript-compatible types
DO $$
BEGIN
    -- Create Trip type
    CREATE TYPE public.Trip AS (
        id UUID,
        name TEXT,
        description TEXT,
        destination TEXT,
        start_date DATE,
        end_date DATE,
        max_participants INTEGER,
        status TEXT,
        admin_comments TEXT,
        organization_id UUID,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ
    );
    
    -- Create Chaperone type
    CREATE TYPE public.Chaperone AS (
        id UUID,
        trip_id UUID,
        staff_id UUID,
        organization_id UUID,
        created_at TIMESTAMPTZ
    );
    
EXCEPTION
    WHEN duplicate_object THEN
        -- Types already exist, ignore
        NULL;
END$$;

-- Step 9: Grant necessary permissions
-- =============================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO authenticated;
GRANT SELECT, INSERT, DELETE ON chaperones TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 10: Verify setup with test data (optional)
-- =============================================

-- Uncomment the following to insert test data:

/*
-- Insert a test trip (replace with actual organization_id)
INSERT INTO trips (
    name,
    description,
    destination,
    start_date,
    end_date,
    max_participants,
    status,
    organization_id
) VALUES (
    'Science Museum Field Trip',
    'Educational visit to explore interactive science exhibits',
    'City Science Museum',
    '2024-03-15',
    '2024-03-15',
    30,
    'active',
    '550e8400-e29b-41d4-a716-446655440000'  -- Replace with your organization_id
);
*/

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Summary of what was created:
-- 1. trips table with proper constraints and indexes
-- 2. chaperones table with foreign key relationships
-- 3. RLS policies for multi-tenant security
-- 4. TypeScript-compatible types for frontend
-- 5. Performance indexes for queries
-- 6. Automated updated_at triggers

-- Next steps:
-- 1. Run this script in your Supabase SQL Editor
-- 2. Verify tables exist: SELECT * FROM trips; SELECT * FROM chaperones;
-- 3. Test the admin trips page: /admin/trips
-- 4. Test the staff trips page: /staff/trips
-- 5. Add real trip data through the UI

COMMENT ON TABLE trips IS 'Stores field trips and educational outings with multi-tenant support';
COMMENT ON TABLE chaperones IS 'Links staff members to trips as chaperones with organization isolation';