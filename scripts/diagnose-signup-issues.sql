-- Diagnose Organization Signup Issues
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR TO DIAGNOSE ISSUES ⚠️

-- 1. Check current organizations table structure
SELECT 'Organizations Table Structure' as check_name;
\d public.organizations;

-- 2. Check RLS status on organizations table
SELECT 
  'RLS Status on Organizations' as check_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'organizations';

-- 3. Check current RLS policies on organizations
SELECT 
  'Current Organizations Policies' as check_name,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY policyname;

-- 4. Check if there are any existing organizations
SELECT 
  'Existing Organizations Count' as check_name,
  COUNT(*) as total_organizations
FROM public.organizations;

-- 5. Test policy conditions (this will show what would be checked during signup)
SELECT 
  'Current User Context' as check_name,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'role' as current_role,
  auth.jwt() ->> 'organization_id' as current_org_id;

-- 6. Check profiles table structure to ensure it supports the role system
SELECT 'Profiles Table Structure' as check_name;
\d public.profiles;

-- 7. Show profiles with admin role to verify the system is working
SELECT 
  'Admin Profiles' as check_name,
  COUNT(*) as admin_count
FROM public.profiles
WHERE role = 'admin';