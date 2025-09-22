-- New RLS policies using auth.jwt() user metadata instead of profiles table
-- This eliminates circular dependencies and simplifies the authorization logic

-- Drop existing RLS policies that depend on profiles table
DROP POLICY IF EXISTS "profiles_select_comprehensive" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;

-- Programs table policies using user metadata
DROP POLICY IF EXISTS "programs_select_org" ON public.programs;
DROP POLICY IF EXISTS "programs_insert_admin" ON public.programs;
DROP POLICY IF EXISTS "programs_update_admin" ON public.programs;
DROP POLICY IF EXISTS "programs_delete_admin" ON public.programs;

CREATE POLICY "programs_select_org_metadata"
  ON public.programs FOR SELECT
  USING (
    -- Users can see programs from their organization
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "programs_insert_admin_metadata"
  ON public.programs FOR INSERT
  WITH CHECK (
    -- Only admins can create programs for their organization
    auth.jwt() ->> 'role' = 'admin'
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "programs_update_admin_metadata"
  ON public.programs FOR UPDATE
  USING (
    -- Only admins can update programs in their organization
    auth.jwt() ->> 'role' = 'admin'
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "programs_delete_admin_metadata"
  ON public.programs FOR DELETE
  USING (
    -- Only admins can delete programs in their organization
    auth.jwt() ->> 'role' = 'admin'
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- Organizations table policies using user metadata
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;

CREATE POLICY "organizations_select_own_metadata"
  ON public.organizations FOR SELECT
  USING (
    -- Users can see their own organization
    id = (auth.jwt() ->> 'organization_id')::uuid
    OR admin_id = auth.uid()
  );

CREATE POLICY "organizations_insert_admin_metadata"
  ON public.organizations FOR INSERT
  WITH CHECK (
    -- Only allow creating organizations where the admin_id matches the current user
    admin_id = auth.uid()
  );

CREATE POLICY "organizations_update_admin_metadata"
  ON public.organizations FOR UPDATE
  USING (
    -- Only organization admin can update their organization
    admin_id = auth.uid()
  );

-- Program participants table policies using user metadata (direct organization_id)
-- NOTE: These policies were already created in script 015_add_organization_id_to_participants.sql
-- Skipping to avoid "already exists" errors

-- Just dropping any old policies that might conflict
DROP POLICY IF EXISTS "participants_select_own_or_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_insert_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_update_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_delete_admin_instructor" ON public.program_participants;

-- The new policies are already created in script 015, so we skip recreation here

-- NOTE: The following tables don't have organization_id column yet
-- Only creating policies for tables that currently have organization_id:
-- - organizations (has id column)
-- - programs (has organization_id) 
-- - program_participants (has organization_id)
-- - profiles (has organization_id but we're moving away from using it)

-- Other tables will need organization_id column added before these policies can be applied:
-- - announcements, documents, lesson_plans, purchase_orders, field_trips

-- For now, we'll skip creating policies for tables without organization_id
-- These can be added later when the schema is updated

/*
-- Announcements table policies (SKIPPED - no organization_id column yet)
-- Documents table policies (SKIPPED - no organization_id column yet)  
-- Lesson plans table policies (SKIPPED - no organization_id column yet)
-- Purchase orders table policies (SKIPPED - no organization_id column yet)
-- Field trips table policies (SKIPPED - no organization_id column yet)

-- To add organization_id to these tables later, run:
-- ALTER TABLE public.announcements ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ALTER TABLE public.documents ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ALTER TABLE public.lesson_plans ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ALTER TABLE public.purchase_orders ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- ALTER TABLE public.field_trips ADD COLUMN organization_id UUID REFERENCES organizations(id);
*/

-- Create a simple profiles policy for backwards compatibility (if we keep some profile functionality)
-- This allows users to see their own basic profile info
CREATE POLICY "profiles_select_own_basic"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own_basic"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Note: No organization_id dependency in profiles policies anymore!
-- All organization-based authorization now comes from auth.jwt() user metadata