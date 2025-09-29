-- =============================================
-- ADD PICKUP_TIME AND RETURN_TIME TO TRIPS TABLE
-- =============================================
-- This script adds the missing time fields to the trips table

-- Step 1: Add pickup_time and return_time columns
-- =============================================
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS pickup_time TIME,
ADD COLUMN IF NOT EXISTS return_time TIME;

-- Step 2: Add comments for documentation
-- =============================================
COMMENT ON COLUMN trips.pickup_time IS 'Time when participants should be picked up for the trip';
COMMENT ON COLUMN trips.return_time IS 'Expected return time for the trip';

-- Step 3: Create indexes for time-based queries (optional but recommended)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_trips_pickup_time ON trips(pickup_time);
CREATE INDEX IF NOT EXISTS idx_trips_return_time ON trips(return_time);

-- Step 4: Update the Trip type to include the new fields
-- =============================================
DROP TYPE IF EXISTS public.Trip CASCADE;

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
    activity_id UUID,
    pickup_time TIME,
    return_time TIME,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if columns were added successfully
SELECT 
    'Column Check' as check_type,
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('pickup_time', 'return_time')
ORDER BY column_name;

-- Check if indexes were created
SELECT 
    'Index Check' as check_type,
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'trips' 
AND indexname IN ('idx_trips_pickup_time', 'idx_trips_return_time');

-- Show the complete trips table structure
SELECT 
    'Complete Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- SAMPLE DATA INSERTION (Optional)
-- =============================================

-- Uncomment to add sample data with times:

/*
-- Update existing trips with sample pickup/return times
UPDATE trips 
SET 
    pickup_time = '08:00:00',
    return_time = '15:00:00'
WHERE pickup_time IS NULL;

-- Or insert a new sample trip with times
INSERT INTO trips (
    name, 
    description, 
    destination, 
    start_date, 
    end_date, 
    pickup_time,
    return_time,
    max_participants, 
    status, 
    organization_id, 
    activity_id
) VALUES (
    'Science Museum Trip with Times',
    'Educational visit with specific pickup and return times',
    'City Science Museum',
    '2024-12-15',
    '2024-12-15',
    '08:30:00',
    '14:30:00',
    25,
    'draft',
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID),
    (SELECT id FROM activities WHERE organization_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID) LIMIT 1)
);
*/

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

SELECT 'Pickup time and return time columns added successfully to trips table!' AS status;