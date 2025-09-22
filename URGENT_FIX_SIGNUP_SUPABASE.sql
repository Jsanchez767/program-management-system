/* 
🔧 FIX SIGNUP DATABASE ERROR - VERIFICATION
   
   PROBLEM: The signup process is failing with "Database error saving new user"
   CAUSE: There's a trigger on auth.users that tries to insert into the dropped profiles table
   SOLUTION: Remove the trigger and function that reference the profiles table
   
   Copy and paste this entire script into your Supabase SQL Editor and run it.
*/

-- Remove the trigger that's causing the signup error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function that tries to insert into profiles table
DROP FUNCTION IF EXISTS public.handle_new_user();

-- The following might error if profiles table doesn't exist - that's OK!
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- VERIFICATION: Check if the problematic trigger is gone
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'on_auth_user_created' 
            AND event_object_table = 'users' 
            AND event_object_schema = 'auth'
        ) THEN '✅ SUCCESS: Signup trigger removed - Signup should work now!'
        ELSE '❌ ERROR: Trigger still exists - Signup will still fail'
    END as signup_fix_status;

-- VERIFICATION: Check if the problematic function is gone
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'handle_new_user'
        ) THEN '✅ SUCCESS: handle_new_user function removed'
        ELSE '❌ ERROR: Function still exists'
    END as function_status;

-- VERIFICATION: List any remaining triggers on auth.users (should be empty)
SELECT 
    trigger_name,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';