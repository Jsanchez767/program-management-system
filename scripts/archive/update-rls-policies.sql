-- RLS Policy Updates for Programs → Activities Migration
-- This script updates existing RLS policies to reflect:
-- 1. Table renames: programs → activities, program_participants → participants
-- 2. Role changes: instructor → staff, student → participant
-- 3. Column renames: program_id → activity_id, instructor_id → staff_id, student_id → participant_id

BEGIN;

-- ================================
-- ACTIVITIES TABLE POLICIES (formerly programs)
-- ================================

-- Drop old program policies if they exist
DROP POLICY IF EXISTS "programs_select_all" ON public.activities;
DROP POLICY IF EXISTS "programs_insert_admin_instructor" ON public.activities;
DROP POLICY IF EXISTS "programs_update_admin_instructor" ON public.activities;
DROP POLICY IF EXISTS "programs_delete_admin" ON public.activities;
DROP POLICY IF EXISTS "Allow admins and instructors in their org to insert programs" ON public.activities;

-- Create new activities policies
CREATE POLICY "activities_select_all"
  ON public.activities FOR SELECT
  USING (true); -- All authenticated users can view activities

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
-- PARTICIPANTS TABLE POLICIES (formerly program_participants)
-- ================================

-- Drop old program_participants policies
DROP POLICY IF EXISTS "participants_select_own_or_admin_instructor" ON public.participants;
DROP POLICY IF EXISTS "participants_insert_admin_instructor" ON public.participants;
DROP POLICY IF EXISTS "participants_update_admin_instructor" ON public.participants;
DROP POLICY IF EXISTS "participants_select_organization" ON public.participants;
DROP POLICY IF EXISTS "participants_manage_authorized" ON public.participants;
DROP POLICY IF EXISTS "program_participants_select_own_or_admin_instructor" ON public.participants;
DROP POLICY IF EXISTS "program_participants_insert_admin_instructor" ON public.participants;
DROP POLICY IF EXISTS "program_participants_update_admin_instructor" ON public.participants;

-- Create new participants policies
CREATE POLICY "participants_select_organization"
  ON public.participants FOR SELECT
  USING (
    -- Participants can see their own enrollments
    participant_id = auth.uid() 
    OR 
    -- Staff can see participants in their activities
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.activities a ON a.staff_id = u.id
      WHERE u.id = auth.uid() 
      AND a.id = activity_id 
      AND u.raw_user_meta_data->>'role' = 'staff'
      AND (u.raw_user_meta_data->>'organization_id')::uuid = organization_id
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
-- ANNOUNCEMENTS TABLE POLICIES
-- ================================

-- Drop old announcement policies with old role references
DROP POLICY IF EXISTS "announcements_select_published_or_role" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_admin_instructor" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_admin_instructor" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_admin_instructor" ON public.announcements;

-- Create updated announcement policies
CREATE POLICY "announcements_select_published_or_role"
  ON public.announcements FOR SELECT
  USING (
    published = true 
    OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
    OR
    -- Participants can see announcements targeted to them
    (
      target_audience IN ('all', 'participants') 
      AND published = true
      AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'participant'
        AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
      )
    )
  );

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

CREATE POLICY "announcements_update_admin_staff"
  ON public.announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR (raw_user_meta_data->>'role' = 'staff' AND id = author_id)
      )
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

CREATE POLICY "announcements_delete_admin_staff"
  ON public.announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (
        raw_user_meta_data->>'role' = 'admin'
        OR (raw_user_meta_data->>'role' = 'staff' AND id = author_id)
      )
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- DOCUMENTS TABLE POLICIES
-- ================================

-- Drop old document policies
DROP POLICY IF EXISTS "documents_select_own_or_admin_instructor" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own_or_admin_instructor" ON public.documents;
DROP POLICY IF EXISTS "documents_update_admin_instructor" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_admin_instructor" ON public.documents;

-- Create updated document policies
CREATE POLICY "documents_select_own_or_admin_staff"
  ON public.documents FOR SELECT
  USING (
    -- Participants can see their own documents
    participant_id = auth.uid()
    OR
    -- Staff can see documents from their activity participants
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN public.activities a ON a.staff_id = u.id
      WHERE u.id = auth.uid()
      AND a.id = activity_id
      AND u.raw_user_meta_data->>'role' = 'staff'
      AND (u.raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
    OR
    -- Admins can see all documents in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
    OR
    -- Public documents can be seen by anyone in the organization
    (
      is_public = true
      AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
      )
    )
  );

CREATE POLICY "documents_insert_own_or_admin_staff"
  ON public.documents FOR INSERT
  WITH CHECK (
    -- Participants can upload their own documents
    participant_id = auth.uid()
    OR
    -- Staff and admins can upload documents
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

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

-- ================================
-- LESSON PLANS TABLE POLICIES
-- ================================

-- Drop old lesson plan policies
DROP POLICY IF EXISTS "lesson_plans_select_own_or_admin" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_insert_instructor" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_update_own_or_admin" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_delete_own_or_admin" ON public.lesson_plans;

-- Create updated lesson plan policies
CREATE POLICY "lesson_plans_select_own_or_admin"
  ON public.lesson_plans FOR SELECT
  USING (
    -- Staff can see their own lesson plans
    staff_id = auth.uid()
    OR
    -- Admins can see all lesson plans in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

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

CREATE POLICY "lesson_plans_update_own_or_admin"
  ON public.lesson_plans FOR UPDATE
  USING (
    -- Staff can update their own lesson plans
    staff_id = auth.uid()
    OR
    -- Admins can update all lesson plans in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

CREATE POLICY "lesson_plans_delete_own_or_admin"
  ON public.lesson_plans FOR DELETE
  USING (
    -- Staff can delete their own lesson plans
    staff_id = auth.uid()
    OR
    -- Admins can delete all lesson plans in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- PURCHASE ORDERS TABLE POLICIES
-- ================================

-- Drop old purchase order policies
DROP POLICY IF EXISTS "purchase_orders_select_own_or_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_instructor" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_own_or_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_own_or_admin" ON public.purchase_orders;

-- Create updated purchase order policies
CREATE POLICY "purchase_orders_select_own_or_admin"
  ON public.purchase_orders FOR SELECT
  USING (
    -- Staff can see their own purchase orders
    requested_by = auth.uid()
    OR
    -- Admins can see all purchase orders in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

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

CREATE POLICY "purchase_orders_update_own_or_admin"
  ON public.purchase_orders FOR UPDATE
  USING (
    -- Staff can update their own purchase orders
    requested_by = auth.uid()
    OR
    -- Admins can update all purchase orders in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

CREATE POLICY "purchase_orders_delete_own_or_admin"
  ON public.purchase_orders FOR DELETE
  USING (
    -- Staff can delete their own purchase orders
    requested_by = auth.uid()
    OR
    -- Admins can delete all purchase orders in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- FIELD TRIPS TABLE POLICIES
-- ================================

-- Drop old field trip policies
DROP POLICY IF EXISTS "field_trips_select_own_or_admin" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_insert_instructor" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_update_own_or_admin" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_delete_own_or_admin" ON public.field_trips;

-- Create updated field trip policies
CREATE POLICY "field_trips_select_own_or_admin"
  ON public.field_trips FOR SELECT
  USING (
    -- Staff can see their own field trips
    staff_id = auth.uid()
    OR
    -- Admins can see all field trips in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
    OR
    -- Participants can see field trips for activities they're enrolled in
    EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.participant_id = auth.uid()
      AND p.activity_id = field_trips.activity_id
      AND p.organization_id = field_trips.organization_id
    )
  );

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

CREATE POLICY "field_trips_update_own_or_admin"
  ON public.field_trips FOR UPDATE
  USING (
    -- Staff can update their own field trips
    staff_id = auth.uid()
    OR
    -- Admins can update all field trips in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

CREATE POLICY "field_trips_delete_own_or_admin"
  ON public.field_trips FOR DELETE
  USING (
    -- Staff can delete their own field trips
    staff_id = auth.uid()
    OR
    -- Admins can delete all field trips in their organization
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organization_id
    )
  );

-- ================================
-- ORGANIZATIONS TABLE POLICIES
-- ================================

-- Drop old organization policies if they exist
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_admin" ON public.organizations;

-- Create updated organization policies
CREATE POLICY "organizations_select_own"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'organization_id')::uuid = organizations.id
    )
  );

CREATE POLICY "organizations_update_admin"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
      AND (raw_user_meta_data->>'organization_id')::uuid = organizations.id
    )
  );

-- ================================
-- USER PROFILES VIEW POLICIES (if using the view)
-- ================================

-- Update policies for user_profiles view if it exists
DROP POLICY IF EXISTS "profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_select_organization" ON public.user_profiles;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "user_profiles_select_organization"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' IN ('admin', 'staff')
      AND (raw_user_meta_data->>'organization_id')::uuid = user_profiles.organization_id
    )
  );

COMMIT;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Verify that policies were created successfully
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('activities', 'participants', 'announcements', 'documents', 'lesson_plans', 'purchase_orders', 'field_trips', 'organizations')
-- ORDER BY tablename, policyname;