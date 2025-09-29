-- =============================================
-- COMPLETE TRIPS SETUP WITH PROGRAM INTEGRATION
-- =============================================
-- This script ensures the trips functionality works with program selection
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure activities table exists (should already exist)
-- =============================================
-- If activities table doesn't exist, this will create it
-- (Usually this already exists from previous migrations)

CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'cancelled')) DEFAULT 'active',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Ensure trips table exists with activity_id
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
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add activity_id column if it doesn't exist
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Step 3: Create necessary indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_activities_organization_id ON activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_trips_organization_id ON trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_trips_activity_id ON trips(activity_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);

-- Step 4: Enable RLS on both tables
-- =============================================
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for activities table
-- =============================================

-- Users can view activities from their organization
DROP POLICY IF EXISTS "Users can view activities from their organization" ON activities;
CREATE POLICY "Users can view activities from their organization" ON activities
    FOR SELECT USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
    );

-- Admins can insert activities
DROP POLICY IF EXISTS "Admins can insert activities" ON activities;
CREATE POLICY "Admins can insert activities" ON activities
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Admins can update activities
DROP POLICY IF EXISTS "Admins can update activities" ON activities;
CREATE POLICY "Admins can update activities" ON activities
    FOR UPDATE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Admins can delete activities
DROP POLICY IF EXISTS "Admins can delete activities" ON activities;
CREATE POLICY "Admins can delete activities" ON activities
    FOR DELETE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Step 6: RLS Policies for trips table
-- =============================================

-- Users can view trips from their organization
DROP POLICY IF EXISTS "Users can view trips from their organization" ON trips;
CREATE POLICY "Users can view trips from their organization" ON trips
    FOR SELECT USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
    );

-- Admins can insert trips
DROP POLICY IF EXISTS "Admins can insert trips" ON trips;
CREATE POLICY "Admins can insert trips" ON trips
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Admins can update trips
DROP POLICY IF EXISTS "Admins can update trips" ON trips;
CREATE POLICY "Admins can update trips" ON trips
    FOR UPDATE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Admins can delete trips
DROP POLICY IF EXISTS "Admins can delete trips" ON trips;
CREATE POLICY "Admins can delete trips" ON trips
    FOR DELETE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
    );

-- Step 7: Grant necessary permissions
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON trips TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 8: Create or update updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for both tables
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert sample data (optional - uncomment to use)
-- =============================================

/*
-- Insert sample activities (replace organization_id with your actual ID)
INSERT INTO activities (name, description, category, status, organization_id) VALUES
    ('Cheerleading Program', 'Youth cheerleading and team building', 'Youth Programs', 'active', '550e8400-e29b-41d4-a716-446655440000'),
    ('Chess Club', 'Strategic thinking and chess skills', 'Youth Programs', 'active', '550e8400-e29b-41d4-a716-446655440000'),
    ('Science Explorers', 'Hands-on science experiments', 'Educational', 'active', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT (id) DO NOTHING;

-- Insert sample trips linked to activities
INSERT INTO trips (name, description, destination, start_date, end_date, max_participants, status, organization_id, activity_id) 
SELECT 
    'Museum Field Trip',
    'Educational visit to explore science exhibits',
    'City Science Museum',
    '2024-12-15',
    '2024-12-15',
    30,
    'active',
    '550e8400-e29b-41d4-a716-446655440000',
    a.id
FROM activities a 
WHERE a.name = 'Science Explorers' 
AND a.organization_id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 1;
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('activities', 'trips');

-- Check foreign key constraint exists
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'trips' AND column_name = 'activity_id';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('activities', 'trips');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('activities', 'trips');

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

-- If you reach this point without errors, the setup is complete!
-- You can now:
-- 1. Create activities/programs in the admin interface
-- 2. Create trips linked to those activities
-- 3. Use the program dropdown in trip creation
-- 4. View trips with their associated program information

SELECT 'Database setup complete! Activities and trips are ready for use.' AS status;