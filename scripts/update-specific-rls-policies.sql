-- Targeted RLS Policy Updates for Programs → Activities Migration
-- Based on current policy analysis from Supabase
-- This script updates existing policies and removes outdated ones

-- First, let's check the actual table structure
-- Uncomment and run this query first to verify column names:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name IN ('participants', 'activities')
-- ORDER BY table_name, ordinal_position;

BEGIN;

-- ================================
-- 1. CLEAN UP OLD PROGRAM POLICIES
-- ================================

-- Remove old program-specific policies that still reference old role names
DROP POLICY IF EXISTS "programs_select_org_metadata" ON public.activities;
DROP POLICY IF EXISTS "programs_insert_admin_metadata" ON public.activities;
DROP POLICY IF EXISTS "programs_update_admin_metadata" ON public.activities;
DROP POLICY IF EXISTS "programs_delete_admin_metadata" ON public.activities;

-- Remove old policies with outdated role references
DROP POLICY IF EXISTS "Allow admins and instructors in their org to insert programs" ON public.activities;
DROP POLICY IF EXISTS "Allow admins and instructors to view programs in their org" ON public.activities;
DROP POLICY IF EXISTS "Allow admins and instructors to update programs in their org" ON public.activities;
DROP POLICY IF EXISTS "Allow admins and instructors to delete programs in their org" ON public.activities;

-- ================================
-- 2. UPDATE PROGRAM_PARTICIPANTS → PARTICIPANTS POLICIES
-- ================================

-- Remove old program_participants policies with instructor references
DROP POLICY IF EXISTS "program_participants_select_org_metadata" ON public.participants;
DROP POLICY IF EXISTS "program_participants_insert_org_metadata" ON public.participants;
DROP POLICY IF EXISTS "program_participants_update_org_metadata" ON public.participants;
DROP POLICY IF EXISTS "program_participants_delete_org_metadata" ON public.participants;

-- ================================
-- 3. CREATE NEW ACTIVITIES POLICIES WITH UPDATED ROLES
-- ================================

-- Activities can be viewed by all authenticated users
DROP POLICY IF EXISTS "activities_select_all" ON public.activities;
CREATE POLICY "activities_select_all"
  ON public.activities FOR SELECT
  USING (true);

-- Only admins and staff can insert activities in their organization
DROP POLICY IF EXISTS "activities_insert_admin_staff" ON public.activities;
CREATE POLICY "activities_insert_admin_staff"
  ON public.activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Admins can update all activities, staff can update their own activities
DROP POLICY IF EXISTS "activities_update_admin_staff" ON public.activities;
CREATE POLICY "activities_update_admin_staff"
  ON public.activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR (raw_user_meta_data->>'role' = 'staff' AND id = staff_id)
      )
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Only admins can delete activities
DROP POLICY IF EXISTS "activities_delete_admin" ON public.activities;
CREATE POLICY "activities_delete_admin"
  ON public.activities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- 4. CREATE NEW PARTICIPANTS POLICIES
-- ================================

-- Participants can view based on role and organization
DROP POLICY IF EXISTS "participants_select_organization" ON public.participants;
CREATE POLICY "participants_select_organization"
  ON public.participants FOR SELECT
  USING (
    -- Participants can see their own enrollments
    user_id = auth.uid()
    OR
    -- Staff can see participants in their activities
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND u.raw_user_meta_data->>'role' = 'staff'
      AND EXISTS (
        SELECT 1 FROM public.activities a 
        WHERE a.staff_id = u.id 
        AND a.id = activity_id
      )
    )
    OR
    -- Admins can see all participants in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Combined policy for insert, update, delete operations on participants
DROP POLICY IF EXISTS "participants_manage_authorized" ON public.participants;
CREATE POLICY "participants_manage_authorized"
  ON public.participants FOR ALL
  USING (
    -- Staff can manage participants in their activities
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.activities a ON a.staff_id = u.id
      WHERE u.id = auth.uid()
      AND a.id = activity_id
      AND u.raw_user_meta_data->>'role' = 'staff'
      AND (u.raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
    OR
    -- Admins can manage all participants in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- 5. UPDATE ORGANIZATION POLICIES
-- ================================

-- Keep existing org policies but ensure they use new role names
DROP POLICY IF EXISTS "organizations_select_own_metadata" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_admin_metadata" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_admin_metadata" ON public.organizations;

-- Create updated organization policies
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
CREATE POLICY "organizations_select_own"
  ON public.organizations FOR SELECT
  USING (
    id = (auth.jwt() ->> 'organization_id')::uuid
    OR 
    id = auth.uid()
  );

DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;
CREATE POLICY "organizations_insert_admin"
  ON public.organizations FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;
CREATE POLICY "organizations_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "organizations_delete_admin" ON public.organizations;
CREATE POLICY "organizations_delete_admin"
  ON public.organizations FOR DELETE
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- ================================
-- 6. UPDATE OTHER TABLE POLICIES TO USE NEW ROLES
-- ================================

-- Update announcements policies to use staff instead of instructor
DROP POLICY IF EXISTS "announcements_select_org" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_org" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_org" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_org" ON public.announcements;

DROP POLICY IF EXISTS "announcements_select_org" ON public.announcements;
CREATE POLICY "announcements_select_org"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "announcements_insert_admin_staff" ON public.announcements;
CREATE POLICY "announcements_insert_admin_staff"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "announcements_update_admin_staff" ON public.announcements;
CREATE POLICY "announcements_update_admin_staff"
  ON public.announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "announcements_delete_admin_staff" ON public.announcements;
CREATE POLICY "announcements_delete_admin_staff"
  ON public.announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Update documents policies
DROP POLICY IF EXISTS "documents_select_org" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_org" ON public.documents;
DROP POLICY IF EXISTS "documents_update_org" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_org" ON public.documents;

DROP POLICY IF EXISTS "documents_select_organization" ON public.documents;
CREATE POLICY "documents_select_organization"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "documents_insert_organization" ON public.documents;
CREATE POLICY "documents_insert_organization"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "documents_update_admin_staff" ON public.documents;
CREATE POLICY "documents_update_admin_staff"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "documents_delete_admin_staff" ON public.documents;
CREATE POLICY "documents_delete_admin_staff"
  ON public.documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Update lesson plans policies
DROP POLICY IF EXISTS "lesson_plans_select_org" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_insert_org" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_update_org" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_delete_org" ON public.lesson_plans;

DROP POLICY IF EXISTS "lesson_plans_select_org" ON public.lesson_plans;
CREATE POLICY "lesson_plans_select_org"
  ON public.lesson_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "lesson_plans_insert_staff" ON public.lesson_plans;
CREATE POLICY "lesson_plans_insert_staff"
  ON public.lesson_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "lesson_plans_update_own_or_admin" ON public.lesson_plans;
CREATE POLICY "lesson_plans_update_own_or_admin"
  ON public.lesson_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "lesson_plans_delete_own_or_admin" ON public.lesson_plans;
CREATE POLICY "lesson_plans_delete_own_or_admin"
  ON public.lesson_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Update purchase orders policies
DROP POLICY IF EXISTS "purchase_orders_select_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_org" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_org" ON public.purchase_orders;

DROP POLICY IF EXISTS "purchase_orders_select_org" ON public.purchase_orders;
CREATE POLICY "purchase_orders_select_org"
  ON public.purchase_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "purchase_orders_insert_staff" ON public.purchase_orders;
CREATE POLICY "purchase_orders_insert_staff"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "purchase_orders_update_own_or_admin" ON public.purchase_orders;
CREATE POLICY "purchase_orders_update_own_or_admin"
  ON public.purchase_orders FOR UPDATE
  USING (
    -- Allow users to update their own purchase orders, or admins to update any
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "purchase_orders_delete_own_or_admin" ON public.purchase_orders;
CREATE POLICY "purchase_orders_delete_own_or_admin"
  ON public.purchase_orders FOR DELETE
  USING (
    -- Allow users to delete their own purchase orders, or admins to delete any
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- Update field trips policies
DROP POLICY IF EXISTS "field_trips_select_org" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_insert_org" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_update_org" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_delete_org" ON public.field_trips;

DROP POLICY IF EXISTS "field_trips_select_org" ON public.field_trips;
CREATE POLICY "field_trips_select_org"
  ON public.field_trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "field_trips_insert_staff" ON public.field_trips;
CREATE POLICY "field_trips_insert_staff"
  ON public.field_trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "field_trips_update_own_or_admin" ON public.field_trips;
CREATE POLICY "field_trips_update_own_or_admin"
  ON public.field_trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

DROP POLICY IF EXISTS "field_trips_delete_own_or_admin" ON public.field_trips;
CREATE POLICY "field_trips_delete_own_or_admin"
  ON public.field_trips FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- 7. CLEAN UP ANY REMAINING OLD POLICIES
-- ================================

-- Remove any remaining old metadata-based policies
DROP POLICY IF EXISTS "invitations_select_by_email" ON public.invitations;

-- ================================
-- 8. ENABLE RLS ON ALL TABLES
-- ================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_trips ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Check table structure for participants and announcements
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name IN ('participants', 'activities', 'announcements')
-- ORDER BY table_name, ordinal_position;

-- Run these queries to verify the policies were created correctly:

-- Check activities policies
-- SELECT tablename, policyname, cmd, permissive 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'activities'
-- ORDER BY policyname;

-- Check participants policies
-- SELECT tablename, policyname, cmd, permissive 
-- FROM pg_policies 
-- WHERE schemaname = 'public' AND tablename = 'participants'
-- ORDER BY policyname;

-- Check for any remaining old policies
-- SELECT tablename, policyname 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND (policyname LIKE '%instructor%' OR policyname LIKE '%student%' OR policyname LIKE '%program%')
-- ORDER BY tablename, policyname;