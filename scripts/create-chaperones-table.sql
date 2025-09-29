-- =============================================
-- CREATE CHAPERONES TABLE FOR TRIPS
-- =============================================
-- This script creates a chaperones table that supports both staff and external chaperones

-- Step 1: Create chaperones table
-- =============================================
CREATE TABLE IF NOT EXISTS chaperones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Staff chaperone (optional - for existing staff members)
    staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- External chaperone details (required for non-staff)
    name TEXT,
    email TEXT,
    phone TEXT,
    
    -- Additional info
    role TEXT DEFAULT 'chaperone', -- 'chaperone', 'lead_chaperone', 'volunteer', etc.
    notes TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chaperone_info_check CHECK (
        -- Either staff_id is provided OR external details are provided
        (staff_id IS NOT NULL) OR 
        (name IS NOT NULL AND email IS NOT NULL)
    ),
    
    -- Ensure unique chaperone per trip (staff can only be assigned once per trip)
    CONSTRAINT unique_staff_per_trip UNIQUE(trip_id, staff_id),
    
    -- Ensure unique external chaperone per trip (same email can't be added twice)
    CONSTRAINT unique_external_per_trip UNIQUE(trip_id, email) DEFERRABLE
);

-- Step 2: Create indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_chaperones_trip_id ON chaperones(trip_id);
CREATE INDEX IF NOT EXISTS idx_chaperones_staff_id ON chaperones(staff_id);
CREATE INDEX IF NOT EXISTS idx_chaperones_organization_id ON chaperones(organization_id);
CREATE INDEX IF NOT EXISTS idx_chaperones_email ON chaperones(email);

-- Step 3: Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE chaperones ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for chaperones table
-- =============================================

-- Users can view chaperones from their organization
DROP POLICY IF EXISTS "Users can view chaperones from their organization" ON chaperones;
CREATE POLICY "Users can view chaperones from their organization" ON chaperones
    FOR SELECT USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
    );

-- Staff and admins can insert chaperones
DROP POLICY IF EXISTS "Staff and admins can insert chaperones" ON chaperones;
CREATE POLICY "Staff and admins can insert chaperones" ON chaperones
    FOR INSERT WITH CHECK (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'instructor')
    );

-- Staff and admins can update chaperones
DROP POLICY IF EXISTS "Staff and admins can update chaperones" ON chaperones;
CREATE POLICY "Staff and admins can update chaperones" ON chaperones
    FOR UPDATE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'instructor')
    );

-- Staff and admins can delete chaperones
DROP POLICY IF EXISTS "Staff and admins can delete chaperones" ON chaperones;
CREATE POLICY "Staff and admins can delete chaperones" ON chaperones
    FOR DELETE USING (
        organization_id = (
            SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID
        )
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin', 'staff', 'instructor')
    );

-- Step 5: Create updated_at trigger
-- =============================================
DROP TRIGGER IF EXISTS update_chaperones_updated_at ON chaperones;
CREATE TRIGGER update_chaperones_updated_at
    BEFORE UPDATE ON chaperones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Grant necessary permissions
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON chaperones TO authenticated;

-- Step 7: Create database type for TypeScript
-- =============================================
DROP TYPE IF EXISTS public.Chaperone CASCADE;

CREATE TYPE public.Chaperone AS (
    id UUID,
    trip_id UUID,
    organization_id UUID,
    staff_id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    notes TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Step 8: Create a view for easier querying with staff info
-- =============================================
CREATE OR REPLACE VIEW chaperones_with_staff AS
SELECT 
    c.*,
    CASE 
        WHEN c.staff_id IS NOT NULL THEN 
            COALESCE(
                ((u.raw_user_meta_data->>'first_name')::text || ' ' || (u.raw_user_meta_data->>'last_name')::text),
                u.email
            )
        ELSE c.name
    END as display_name,
    CASE 
        WHEN c.staff_id IS NOT NULL THEN u.email
        ELSE c.email
    END as contact_email,
    CASE 
        WHEN c.staff_id IS NOT NULL THEN (u.raw_user_meta_data->>'phone')::text
        ELSE c.phone
    END as contact_phone,
    c.staff_id IS NOT NULL as is_staff
FROM chaperones c
LEFT JOIN auth.users u ON c.staff_id = u.id;

-- Grant access to the view
GRANT SELECT ON chaperones_with_staff TO authenticated;

-- Step 9: Add comments for documentation
-- =============================================
COMMENT ON TABLE chaperones IS 'Stores chaperones for trips - supports both staff members and external volunteers';
COMMENT ON COLUMN chaperones.staff_id IS 'References auth.users for existing staff members (optional)';
COMMENT ON COLUMN chaperones.name IS 'Name for external chaperones (required if staff_id is null)';
COMMENT ON COLUMN chaperones.email IS 'Email for external chaperones (required if staff_id is null)';
COMMENT ON COLUMN chaperones.phone IS 'Phone number for external chaperones';
COMMENT ON COLUMN chaperones.role IS 'Role of the chaperone (chaperone, lead_chaperone, volunteer, etc.)';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if table was created successfully
SELECT 
    'Table Structure Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chaperones' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    'Foreign Key Check' as check_type,
    conname as constraint_name,
    conrelid::regclass as table_name,
    a.attname as column_name,
    confrelid::regclass as foreign_table_name,
    af.attname as foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid::regclass::text = 'chaperones' AND contype = 'f';

-- Check RLS policies
SELECT 
    'RLS Policies Check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as command_type
FROM pg_policies 
WHERE tablename = 'chaperones' AND schemaname = 'public';

-- Check indexes
SELECT 
    'Index Check' as check_type,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'chaperones' AND schemaname = 'public';

-- =============================================
-- SAMPLE DATA INSERTION (Optional)
-- =============================================

-- Uncomment to add sample chaperone data:

/*
-- Sample staff chaperone (using existing staff member)
INSERT INTO chaperones (
    trip_id,
    organization_id,
    staff_id,
    role,
    notes
) VALUES (
    (SELECT id FROM trips WHERE name LIKE '%Museum%' LIMIT 1),
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID),
    (SELECT id FROM auth.users WHERE email LIKE '%@%' LIMIT 1),
    'lead_chaperone',
    'Experienced with field trips'
);

-- Sample external chaperone
INSERT INTO chaperones (
    trip_id,
    organization_id,
    name,
    email,
    phone,
    role,
    emergency_contact_name,
    emergency_contact_phone,
    notes
) VALUES (
    (SELECT id FROM trips WHERE name LIKE '%Museum%' LIMIT 1),
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID),
    'Sarah Johnson',
    'sarah.johnson@email.com',
    '555-0123',
    'volunteer',
    'Mike Johnson',
    '555-0124',
    'Parent volunteer with first aid certification'
);
*/

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'Chaperones table created successfully with support for both staff and external chaperones!' AS status;