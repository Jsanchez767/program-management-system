-- Fix RLS policies for production signup flow
-- Prevents infinite recursion during admin account creation
-- Run this after script 010_multi_tenant_policies.sql

-- Allow profile creation during signup without organization_id validation
DROP POLICY IF EXISTS "profiles_insert_signup" ON profiles;
CREATE POLICY "profiles_insert_signup" ON profiles
FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

-- Allow profile updates for organization_id linking
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Fix select policy to handle NULL organization_id gracefully
DROP POLICY IF EXISTS "profiles_select_comprehensive" ON profiles;
CREATE POLICY "profiles_select_comprehensive" ON profiles
FOR SELECT TO authenticated
USING (
  -- Always allow users to see their own profile
  id = auth.uid() 
  OR 
  -- Organization-based access (only when both parties have organization_id)
  (
    organization_id IS NOT NULL 
    AND (
      -- Admins see profiles in their organization
      EXISTS (
        SELECT 1 FROM profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
        AND admin_profile.organization_id = profiles.organization_id
        AND admin_profile.organization_id IS NOT NULL
      )
      OR
      -- Instructors see students in their organization
      (
        profiles.role = 'student'
        AND EXISTS (
          SELECT 1 FROM profiles instructor_profile
          WHERE instructor_profile.id = auth.uid() 
          AND instructor_profile.role = 'instructor'
          AND instructor_profile.organization_id = profiles.organization_id
          AND instructor_profile.organization_id IS NOT NULL
        )
      )
    )
  )
);