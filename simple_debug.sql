-- Simple SQL to check what might be causing the signup error
-- Run this in Supabase SQL Editor

-- Check if profiles table still exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
) as profiles_table_exists;

-- Check for any triggers on auth.users
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Check for functions that might insert into profiles
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%profiles%' 
AND routine_schema = 'public';