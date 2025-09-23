-- Diagnostic script for invitations issues
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- 1. Check if invitations table exists and its structure
SELECT 
  'Invitations Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- 2. Check RLS policies on invitations table
SELECT 
  'Invitations RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'invitations';

-- 3. Check if we have any existing invitations
SELECT 
  'Existing Invitations Count' as check_type,
  COUNT(*) as total_invitations
FROM public.invitations;

-- 4. Check organizations table to see if admin users have organizations
SELECT 
  'Organizations Check' as check_type,
  id,
  name,
  admin_id,
  created_at
FROM public.organizations
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check current user context (this will show what auth.jwt() returns)
-- Note: This only works if you're logged in when running
SELECT 
  'Current Auth Context' as check_type,
  auth.uid() as current_user_id,
  auth.jwt() ->> 'role' as user_role,
  auth.jwt() ->> 'organization_id' as user_org_id;