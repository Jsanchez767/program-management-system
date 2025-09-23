-- Fix Organization Signup RLS Policy
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR AND RUN IT ⚠️
-- This script fixes the issue where new admin users can't create organizations during signup
-- because the RLS policy requires admin role before the organization exists

BEGIN;

-- Drop existing organizations insert policy
DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;

-- Create a new policy that allows organization creation during signup
-- This allows:
-- 1. Existing admins to create organizations (role-based)
-- 2. New users during signup to create their organization (before role is set)
CREATE POLICY "organizations_insert_signup_and_admin"
  ON public.organizations FOR INSERT
  WITH CHECK (
    -- Allow if user already has admin role (existing admin creating new org)
    (auth.jwt() ->> 'role') = 'admin'
    OR
    -- Allow if user is authenticated but doesn't have an organization_id yet (new signup)
    (
      auth.uid() IS NOT NULL 
      AND (auth.jwt() ->> 'organization_id') IS NULL
      AND admin_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT 
  'Policy created successfully' as status,
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  with_check
FROM pg_policies 
WHERE tablename = 'organizations' AND policyname = 'organizations_insert_signup_and_admin';

COMMIT;