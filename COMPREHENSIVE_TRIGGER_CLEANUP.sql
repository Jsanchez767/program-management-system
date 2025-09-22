/* 
🔧 COMPREHENSIVE TRIGGER CLEANUP - Find and Remove ALL Auth Triggers
   
   The previous script didn't work, so let's find ALL triggers and functions 
   that might be causing the signup error.
   
   Copy and paste this entire script into your Supabase SQL Editor and run it.
*/

-- STEP 1: Find ALL triggers on auth.users table (this will show us what's actually there)
SELECT 
    'FOUND TRIGGER: ' || trigger_name as found_triggers,
    trigger_name,
    action_statement,
    action_timing,
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- STEP 2: Find ALL functions that might reference profiles
SELECT 
    'FOUND FUNCTION: ' || proname as found_functions,
    proname as function_name,
    CASE 
        WHEN prosrc ILIKE '%profiles%' THEN 'REFERENCES PROFILES TABLE!'
        ELSE 'Safe'
    END as profile_reference
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- STEP 3: Remove common trigger variations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users;
DROP TRIGGER IF EXISTS auto_create_profile ON auth.users;

-- STEP 4: Remove common function variations
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_signup();
DROP FUNCTION IF EXISTS public.create_profile_for_user();
DROP FUNCTION IF EXISTS public.auto_create_profile();

-- STEP 5: Check if we got them all
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All auth triggers removed!'
        ELSE '❌ STILL HAVE ' || COUNT(*) || ' TRIGGERS - Need manual removal'
    END as final_status
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- STEP 6: List any remaining triggers that need manual removal
SELECT 
    'MANUAL REMOVAL NEEDED: DROP TRIGGER ' || trigger_name || ' ON auth.users;' as manual_commands
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';