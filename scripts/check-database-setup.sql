-- =============================================
-- DATABASE SETUP CHECKER
-- =============================================
-- Run this script to check if your database is properly configured
-- for the trips and activities functionality

-- Check 1: Do the required tables exist?
-- =============================================
SELECT 
    'Table Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities' AND table_schema = 'public') 
        THEN '✅ activities table exists'
        ELSE '❌ activities table missing'
    END as activities_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips' AND table_schema = 'public') 
        THEN '✅ trips table exists'
        ELSE '❌ trips table missing'
    END as trips_status;

-- Check 2: Does trips table have activity_id column?
-- =============================================
SELECT 
    'Column Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'trips' AND column_name = 'activity_id' AND table_schema = 'public'
        ) 
        THEN '✅ trips.activity_id column exists'
        ELSE '❌ trips.activity_id column missing - REQUIRED FOR PROGRAM SELECTION'
    END as activity_id_status;

-- Check 3: Are the foreign key constraints in place?
-- =============================================
SELECT 
    'Foreign Key Check' as check_type,
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu1 ON rc.constraint_name = kcu1.constraint_name
JOIN information_schema.key_column_usage kcu2 ON rc.unique_constraint_name = kcu2.constraint_name
WHERE kcu1.table_name IN ('trips', 'activities') AND kcu1.table_schema = 'public';

-- Check 4: Is RLS enabled?
-- =============================================
SELECT 
    'RLS Check' as check_type,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS enabled'
        ELSE '❌ RLS disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('activities', 'trips');

-- Check 5: Do we have the necessary RLS policies?
-- =============================================
SELECT 
    'Policy Check' as check_type,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Has CRUD policies'
        WHEN COUNT(*) > 0 THEN '⚠️ Some policies missing'
        ELSE '❌ No policies found'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('activities', 'trips')
GROUP BY tablename;

-- Check 6: Sample data count
-- =============================================
SELECT 
    'Data Check' as check_type,
    (SELECT COUNT(*) FROM activities) as activities_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    CASE 
        WHEN (SELECT COUNT(*) FROM activities) > 0 THEN '✅ Has activities'
        ELSE '⚠️ No activities - create some in admin panel'
    END as data_status;

-- =============================================
-- REQUIRED ACTIONS SUMMARY
-- =============================================

SELECT '
NEXT STEPS TO COMPLETE SETUP:

1. If trips.activity_id column is missing:
   - Run: scripts/add-activity-id-to-trips.sql
   
2. If tables or policies are missing:
   - Run: scripts/complete-trips-setup.sql
   
3. Create some activities/programs:
   - Go to Admin > Programs
   - Create at least one active program
   
4. Test trip creation:
   - Go to Admin > Trips  
   - Click "Add Trip"
   - Select a program from dropdown
   - Fill out trip details and create

5. Verify everything works:
   - Check that trips show associated program badges
   - Verify real-time updates work
   - Test collapsible sidebar functionality

' as instructions;