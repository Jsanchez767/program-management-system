-- =============================================
-- TRIPS TABLE DIAGNOSTIC SCRIPT
-- =============================================
-- Run this in your Supabase SQL Editor to diagnose the trips table setup

-- Check 1: Verify trips table structure
-- =============================================
SELECT 
    'Table Structure Check' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check 2: Verify RLS policies for trips table
-- =============================================
SELECT 
    'RLS Policies Check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as command_type,
    CASE cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END as operation
FROM pg_policies 
WHERE tablename = 'trips' AND schemaname = 'public';

-- Check 3: Check foreign key constraints
-- =============================================
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
WHERE conrelid::regclass::text = 'trips' AND contype = 'f';

-- Check 4: Test if we can insert a trip (this will show any policy errors)
-- =============================================
-- This is a dry run - it will show what would happen
EXPLAIN (FORMAT TEXT) 
INSERT INTO trips (
    name, 
    description, 
    destination, 
    start_date, 
    end_date, 
    max_participants, 
    status, 
    organization_id, 
    activity_id
) VALUES (
    'Test Trip',
    'Test Description', 
    'Test Destination',
    '2024-12-01',
    '2024-12-01',
    20,
    'draft',
    (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID),
    (SELECT id FROM activities WHERE organization_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'organization_id')::UUID) LIMIT 1)
);

-- Check 5: Sample data verification
-- =============================================
SELECT 
    'Data Check' as check_type,
    COUNT(*) as total_trips,
    COUNT(CASE WHEN activity_id IS NOT NULL THEN 1 END) as trips_with_activity_id,
    COUNT(CASE WHEN activity_id IS NULL THEN 1 END) as trips_without_activity_id
FROM trips;

-- Check 6: Look for any trips table that might have old column names
-- =============================================
SELECT 
    'Column Name Check' as check_type,
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name LIKE '%trip%' 
AND column_name LIKE '%program%';

-- Check 7: Check if there are any triggers or functions that might be causing issues
-- =============================================
SELECT 
    'Triggers Check' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'trips';

-- =============================================
-- SUMMARY
-- =============================================
SELECT '
DIAGNOSTIC COMPLETE!

If you see any issues:
1. Missing RLS policies - run complete-trips-setup.sql
2. Wrong column references in policies - they should use activity_id not program_id
3. Missing foreign key constraints - run add-activity-id-to-trips.sql
4. Triggers causing issues - may need to be updated

The most likely issue is that RLS policies are referencing old field names.
Check the policy definitions above for any references to program_id instead of activity_id.
' as summary;