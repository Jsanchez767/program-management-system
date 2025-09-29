-- =============================================
-- ADD ACTIVITY_ID TO TRIPS TABLE
-- =============================================
-- This script adds the missing activity_id column to the trips table
-- and updates related policies and constraints

-- Step 1: Add activity_id column to trips table
-- =============================================
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Step 2: Create index for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_trips_activity_id ON trips(activity_id);

-- Step 3: Update the Trip type to include activity_id
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
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Step 4: Add comment for documentation
-- =============================================
COMMENT ON COLUMN trips.activity_id IS 'Foreign key reference to the associated activity/program';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trips' AND column_name = 'activity_id';

-- Check if index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'trips' AND indexname = 'idx_trips_activity_id';

-- =============================================
-- NOTES FOR IMPLEMENTATION
-- =============================================

-- This migration adds the missing activity_id column that's required for:
-- 1. Linking trips to specific programs/activities
-- 2. Displaying program information in the trips UI
-- 3. Enforcing referential integrity between trips and activities
-- 4. Supporting real-time updates with proper relationships

-- After running this script:
-- 1. Existing trips will have NULL activity_id (needs manual assignment)
-- 2. New trips created through the UI will include the activity_id
-- 3. The dropdown in trip creation will work properly
-- 4. Trip display will show associated program information

-- Optional: Update existing trips with activity_id if needed
-- UPDATE trips SET activity_id = (SELECT id FROM activities WHERE organization_id = trips.organization_id LIMIT 1) WHERE activity_id IS NULL;