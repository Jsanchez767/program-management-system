-- Comprehensive Database Migration: Programs → Activities, Roles Update
-- This script renames programs to activities, program_participants to participants,
-- and updates user roles from staff/student to staff/participant

BEGIN;

-- ================================
-- STEP 1: UPDATE USER ROLES IN SUPABASE AUTH
-- ================================

-- Update user roles in auth.users metadata
-- staff → staff
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data, 
  '{role}', 
  '"staff"'
)
WHERE raw_user_meta_data->>'role' = 'staff';

-- student → participant  
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data, 
  '{role}', 
  '"participant"'
)
WHERE raw_user_meta_data->>'role' = 'participant';

-- admin stays as admin (no change needed)

-- ================================
-- STEP 2: RENAME TABLES
-- ================================

-- Rename programs table to activities
ALTER TABLE public.programs RENAME TO activities;

-- Rename program_participants table to participants
ALTER TABLE public.program_participants RENAME TO participants;

-- ================================
-- STEP 3: UPDATE COLUMN NAMES IN RENAMED TABLES
-- ================================

-- Update foreign key column name in participants table
ALTER TABLE public.participants RENAME COLUMN activity_id TO activity_id;

-- Update foreign key column name in participants table (participant_id → participant_id)
ALTER TABLE public.participants RENAME COLUMN participant_id TO participant_id;

-- ================================
-- STEP 4: UPDATE FOREIGN KEY REFERENCES IN OTHER TABLES
-- ================================

-- Update announcements table
ALTER TABLE public.announcements RENAME COLUMN activity_id TO activity_id;

-- Update documents table  
ALTER TABLE public.documents RENAME COLUMN activity_id TO activity_id;
ALTER TABLE public.documents RENAME COLUMN participant_id TO participant_id;

-- Update lesson_plans table
ALTER TABLE public.lesson_plans RENAME COLUMN activity_id TO activity_id;

-- Update purchase_orders table
ALTER TABLE public.purchase_orders RENAME COLUMN activity_id TO activity_id;

-- Update field_trips table
ALTER TABLE public.field_trips RENAME COLUMN activity_id TO activity_id;

-- Update staff_id columns to staff_id across all tables
ALTER TABLE public.activities RENAME COLUMN staff_id TO staff_id;
ALTER TABLE public.field_trips RENAME COLUMN staff_id TO staff_id;

-- ================================
-- STEP 5: DROP OLD POLICIES AND CONSTRAINTS
-- ================================

-- Drop existing policies on the renamed tables (they reference old table names)
DROP POLICY IF EXISTS "programs_select_all" ON public.activities;
DROP POLICY IF EXISTS "programs_insert_admin_staff" ON public.activities;
DROP POLICY IF EXISTS "programs_update_admin_staff" ON public.activities;
DROP POLICY IF EXISTS "programs_delete_admin" ON public.activities;

DROP POLICY IF EXISTS "participants_select_own_or_admin_staff" ON public.participants;
DROP POLICY IF EXISTS "participants_insert_admin_staff" ON public.participants;
DROP POLICY IF EXISTS "participants_update_admin_staff" ON public.participants;
DROP POLICY IF EXISTS "participants_select_organization" ON public.participants;
DROP POLICY IF EXISTS "participants_manage_authorized" ON public.participants;

-- ================================
-- STEP 6: CREATE NEW POLICIES WITH UPDATED ROLES
-- ================================

-- Activities table policies (updated for new roles)
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

-- Participants table policies (updated for new roles and table structure)
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
-- STEP 7: UPDATE RPC FUNCTIONS
-- ================================

-- Drop old RPC functions
DROP FUNCTION IF EXISTS public.insert_activity_admin(TEXT, TEXT, TEXT, DATE, DATE, INTEGER, UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.get_staffs_for_organization(UUID);

-- Create new RPC function for inserting activities
CREATE OR REPLACE FUNCTION public.insert_activity_admin(
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_max_participants INTEGER,
  p_staff_id UUID,
  p_status TEXT,
  p_organization_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_org_id UUID;
  v_activity_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user role and organization from JWT
  v_role := auth.jwt() ->> 'role';
  v_org_id := (auth.jwt() ->> 'organization_id')::UUID;

  -- If missing, get from database
  IF v_role IS NULL OR v_org_id IS NULL THEN
    SELECT raw_user_meta_data->>'role', (raw_user_meta_data->>'organization_id')::UUID
    INTO v_role, v_org_id
    FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Only allow admins or staff to create activities in their own org
  IF v_role NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admins and staff can create activities';
  END IF;
  IF v_org_id IS NULL OR v_org_id != p_organization_id THEN
    RAISE EXCEPTION 'Organization mismatch or missing';
  END IF;

  -- Insert the activity
  INSERT INTO public.activities (
    name, description, category, start_date, end_date, max_participants,
    staff_id, status, current_participants, organization_id
  ) VALUES (
    p_name, p_description, p_category, p_start_date, p_end_date, p_max_participants,
    p_staff_id, p_status, 0, v_org_id
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

-- Create new RPC function for getting staff for organization
CREATE OR REPLACE FUNCTION public.get_staff_for_organization(org_id UUID)
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to view staff
  IF NOT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      raw_user_meta_data->>'role' = 'admin' 
      OR raw_user_meta_data->>'role' = 'staff'
    )
    AND (raw_user_meta_data->>'organization_id')::UUID = org_id
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to view staff';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    (u.raw_user_meta_data->>'organization_id')::UUID as organization_id,
    u.created_at
  FROM auth.users u
  WHERE (u.raw_user_meta_data->>'organization_id')::UUID = org_id
    AND u.raw_user_meta_data->>'role' = 'staff'
    AND u.deleted_at IS NULL;
END;
$$;

-- ================================
-- STEP 8: UPDATE HELPER FUNCTIONS
-- ================================

-- Update helper functions to use new role names
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'staff'
  );
END;
$$;

-- Keep is_admin() function (no change)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$;

-- Update is_student() to is_participant()
CREATE OR REPLACE FUNCTION public.is_participant()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'participant'
  );
END;
$$;

-- Update get_user_role() function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data->>'role'
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Drop old functions
DROP FUNCTION IF EXISTS public.is_staff();
DROP FUNCTION IF EXISTS public.is_student();

-- ================================
-- STEP 9: UPDATE TRIGGERS
-- ================================

-- Update trigger function for activities organization ID
CREATE OR REPLACE FUNCTION public.set_activity_organization_id()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := (auth.jwt() ->> 'organization_id')::UUID;
  IF v_org_id IS NULL THEN
    SELECT (raw_user_meta_data->>'organization_id')::UUID
    INTO v_org_id
    FROM auth.users WHERE id = auth.uid();
  END IF;
  
  IF v_org_id IS NOT NULL THEN
    NEW.organization_id := v_org_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS set_program_organization_id_trigger ON public.activities;
CREATE TRIGGER set_activity_organization_id_trigger
  BEFORE INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_activity_organization_id();

-- ================================
-- STEP 10: UPDATE CONSTRAINTS AND INDEXES
-- ================================

-- Recreate foreign key constraints with new names
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS program_participants_activity_id_fkey;
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS program_participants_participant_id_fkey;

-- Add new constraints for activities
ALTER TABLE public.participants 
ADD CONSTRAINT participants_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

-- Add new constraints for participants
ALTER TABLE public.participants 
ADD CONSTRAINT participants_participant_id_fkey 
FOREIGN KEY (participant_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update unique constraint
ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS program_participants_activity_id_participant_id_key;
ALTER TABLE public.participants 
ADD CONSTRAINT participants_activity_id_participant_id_key 
UNIQUE(activity_id, participant_id);

-- ================================
-- STEP 11: UPDATE OTHER TABLE CONSTRAINTS
-- ================================

-- Update foreign key constraints in other tables
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_activity_id_fkey;
ALTER TABLE public.announcements 
ADD CONSTRAINT announcements_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_activity_id_fkey;
ALTER TABLE public.documents 
ADD CONSTRAINT documents_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE SET NULL;

ALTER TABLE public.lesson_plans DROP CONSTRAINT IF EXISTS lesson_plans_activity_id_fkey;
ALTER TABLE public.lesson_plans 
ADD CONSTRAINT lesson_plans_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_activity_id_fkey;
ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.field_trips DROP CONSTRAINT IF EXISTS field_trips_activity_id_fkey;
ALTER TABLE public.field_trips 
ADD CONSTRAINT field_trips_activity_id_fkey 
FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

-- Update staff_id foreign key constraints
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS programs_staff_id_fkey;
ALTER TABLE public.activities 
ADD CONSTRAINT activities_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.field_trips DROP CONSTRAINT IF EXISTS field_trips_staff_id_fkey;
ALTER TABLE public.field_trips 
ADD CONSTRAINT field_trips_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- ================================
-- STEP 12: UPDATE USER_PROFILES VIEW
-- ================================

-- Update the user_profiles view to use new role names
DROP VIEW IF EXISTS public.user_profiles;
CREATE VIEW public.user_profiles AS
SELECT 
  id,
  email,
  raw_user_meta_data ->> 'first_name' as first_name,
  raw_user_meta_data ->> 'last_name' as last_name,
  raw_user_meta_data ->> 'role' as role,
  (raw_user_meta_data ->> 'organization_id')::uuid as organization_id,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE deleted_at IS NULL;

GRANT SELECT ON public.user_profiles TO authenticated;

COMMIT;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Verify the changes
-- SELECT 'User roles updated:' as status;
-- SELECT raw_user_meta_data->>'role' as role, count(*) 
-- FROM auth.users 
-- WHERE raw_user_meta_data->>'role' IS NOT NULL 
-- GROUP BY raw_user_meta_data->>'role';

-- SELECT 'Tables renamed successfully' as status;
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('activities', 'participants');

-- SELECT 'RPC functions created' as status;
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('insert_activity_admin', 'get_staff_for_organization');