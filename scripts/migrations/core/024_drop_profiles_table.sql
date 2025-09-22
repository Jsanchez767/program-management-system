-- Safely drop the profiles table and related triggers/functions
-- This completes the migration to user metadata-only architecture

-- First, drop any policies that reference the profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Drop the trigger that creates profiles on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that handles new user profile creation
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_organization();

-- Drop any foreign key constraints that reference profiles
-- (Note: This will cascade to any tables that reference profiles)
ALTER TABLE IF EXISTS programs DROP CONSTRAINT IF EXISTS programs_instructor_id_fkey;
ALTER TABLE IF EXISTS lesson_plans DROP CONSTRAINT IF EXISTS lesson_plans_instructor_id_fkey;
ALTER TABLE IF EXISTS purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_created_by_fkey;
ALTER TABLE IF EXISTS field_trips DROP CONSTRAINT IF EXISTS field_trips_instructor_id_fkey;

-- Update foreign key constraints to reference auth.users directly
ALTER TABLE programs 
ADD CONSTRAINT programs_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Disable RLS on profiles table before dropping
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any remaining functions related to profiles
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Create a comment to document this change
COMMENT ON SCHEMA public IS 'Schema updated to use user metadata exclusively. Profiles table removed in favor of auth.users.raw_user_meta_data approach for better performance and simpler architecture.';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Successfully dropped profiles table and related functions. System now uses user metadata exclusively.';
END $$;



-- First, drop any policies that reference the profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Drop the trigger that creates profiles on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop any remaining functions related to profiles
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop any remaining functions related to profiles
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Update foreign key constraints to reference auth.users directly
ALTER TABLE programs 
ADD CONSTRAINT programs_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop any foreign key constraints that reference profiles
-- (Note: This will cascade to any tables that reference profiles)
ALTER TABLE IF EXISTS programs DROP CONSTRAINT IF EXISTS programs_instructor_id_fkey;
ALTER TABLE IF EXISTS lesson_plans DROP CONSTRAINT IF EXISTS lesson_plans_instructor_id_fkey;
ALTER TABLE IF EXISTS purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_created_by_fkey;
ALTER TABLE IF EXISTS field_trips DROP CONSTRAINT IF EXISTS field_trips_instructor_id_fkey;
