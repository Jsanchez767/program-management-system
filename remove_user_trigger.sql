-- Find and remove the trigger that's causing "Database error saving new user"
-- This is likely a trigger on auth.users that tries to insert into profiles table

-- First, let's see what triggers exist on auth.users
-- (You'll need to run this in Supabase SQL Editor)

-- Step 1: Check for triggers (run this first to identify the trigger)
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Step 2: Once you identify the trigger name, drop it
-- Common trigger names are: on_auth_user_created, handle_new_user, etc.
-- Replace 'trigger_name_here' with the actual trigger name from step 1

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- Step 3: Also drop the associated function if it exists
-- Common function names: handle_new_user(), public.handle_new_user(), etc.

-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Verify no triggers remain
SELECT trigger_name 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';