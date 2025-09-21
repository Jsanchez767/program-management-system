-- Multi-Tenant Row Level Security (RLS) Policies
-- This script creates comprehensive RLS policies for complete data isolation between organizations
-- Run this AFTER creating all tables and the organizations setup (scripts 001-009)

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "allow_profile_creation" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_instructor_view_students" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_signup" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_comprehensive" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_all" ON public.profiles;

-- Create single, comprehensive profile policies
CREATE POLICY "profiles_select_comprehensive"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid() 
        AND admin_profile.role = 'admin'
        AND admin_profile.organization_id = profiles.organization_id
      )
    ) OR
    (
      EXISTS (
        SELECT 1 FROM public.profiles instructor_profile
        WHERE instructor_profile.id = auth.uid() 
        AND instructor_profile.role = 'instructor'
        AND instructor_profile.organization_id = profiles.organization_id
        AND profiles.role = 'student'
      )
    )
  );

CREATE POLICY "profiles_insert_signup"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- ==========================================
-- 2. ANNOUNCEMENTS TABLE
-- ==========================================
-- Drop existing announcement policies
DROP POLICY IF EXISTS "announcements_select_published" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_own_or_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_admin_instructor" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_own_or_admin" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_organization" ON public.announcements;
DROP POLICY IF EXISTS "announcements_manage_authorized" ON public.announcements;

-- Create clean announcement policies (using author relationship)
CREATE POLICY "announcements_select_org"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles author
      WHERE user_profile.id = auth.uid()
      AND author.id = announcements.author_id
      AND user_profile.organization_id = author.organization_id
    )
  );

CREATE POLICY "announcements_insert_admin_instructor"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "announcements_update_own_or_admin"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles author
      WHERE user_profile.id = auth.uid()
      AND author.id = announcements.author_id
      AND user_profile.organization_id = author.organization_id
      AND user_profile.role = 'admin'
    )
  );

-- ==========================================
-- 3. DOCUMENTS TABLE
-- ==========================================
-- Drop existing document policies
DROP POLICY IF EXISTS "documents_select_own_or_admin_instructor" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documents_update_own_or_admin" ON public.documents;
DROP POLICY IF EXISTS "documents_select_organization" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_student" ON public.documents;
DROP POLICY IF EXISTS "documents_manage_authorized" ON public.documents;

-- Create clean document policies (using student relationship)
CREATE POLICY "documents_select_org"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles student
      WHERE user_profile.id = auth.uid()
      AND student.id = documents.student_id
      AND user_profile.organization_id = student.organization_id
      AND user_profile.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "documents_insert_own"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "documents_update_own_or_admin"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles student
      WHERE user_profile.id = auth.uid()
      AND student.id = documents.student_id
      AND user_profile.organization_id = student.organization_id
      AND user_profile.role = 'admin'
    )
  );

-- ==========================================
-- 4. LESSON PLANS TABLE
-- ==========================================
-- Drop existing lesson plan policies
DROP POLICY IF EXISTS "lesson_plans_select_own_or_admin" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_insert_own_instructor" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_update_own_or_admin" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_select_organization" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_manage_instructor" ON public.lesson_plans;

-- Create clean lesson plan policies (using instructor relationship through programs)
CREATE POLICY "lesson_plans_select_org"
  ON public.lesson_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = lesson_plans.instructor_id
      AND user_profile.organization_id = instructor.organization_id
    )
  );

CREATE POLICY "lesson_plans_insert_instructor"
  ON public.lesson_plans FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "lesson_plans_update_own_or_admin"
  ON public.lesson_plans FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = lesson_plans.instructor_id
      AND user_profile.organization_id = instructor.organization_id
      AND user_profile.role = 'admin'
    )
  );

-- ==========================================
-- 5. PURCHASE ORDERS TABLE
-- ==========================================
-- Drop existing purchase order policies
DROP POLICY IF EXISTS "purchase_orders_select_own_or_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_own_instructor" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_own_or_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_select_organization" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_manage_instructor" ON public.purchase_orders;

-- Create clean purchase order policies (using instructor relationship)
CREATE POLICY "purchase_orders_select_org"
  ON public.purchase_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = purchase_orders.instructor_id
      AND user_profile.organization_id = instructor.organization_id
    )
  );

CREATE POLICY "purchase_orders_insert_instructor"
  ON public.purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "purchase_orders_update_own_or_admin"
  ON public.purchase_orders FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = purchase_orders.instructor_id
      AND user_profile.organization_id = instructor.organization_id
      AND user_profile.role = 'admin'
    )
  );

-- ==========================================
-- 6. FIELD TRIPS TABLE
-- ==========================================
-- Drop existing field trip policies
DROP POLICY IF EXISTS "field_trips_select_own_or_admin" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_insert_own_instructor" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_update_own_or_admin" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_select_organization" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_manage_instructor" ON public.field_trips;

-- Create clean field trip policies (using instructor relationship)
CREATE POLICY "field_trips_select_org"
  ON public.field_trips FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = field_trips.instructor_id
      AND user_profile.organization_id = instructor.organization_id
    )
  );

CREATE POLICY "field_trips_insert_instructor"
  ON public.field_trips FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "field_trips_update_own_or_admin"
  ON public.field_trips FOR UPDATE
  TO authenticated
  USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles user_profile, public.profiles instructor
      WHERE user_profile.id = auth.uid()
      AND instructor.id = field_trips.instructor_id
      AND user_profile.organization_id = instructor.organization_id
      AND user_profile.role = 'admin'
    )
  );

-- ==========================================
-- 7. PROGRAMS TABLE
-- ==========================================
-- Drop existing program policies
DROP POLICY IF EXISTS "programs_select_all" ON public.programs;
DROP POLICY IF EXISTS "programs_insert_admin_instructor" ON public.programs;
DROP POLICY IF EXISTS "programs_update_admin_instructor" ON public.programs;
DROP POLICY IF EXISTS "programs_delete_admin" ON public.programs;

-- Create clean program policies
CREATE POLICY "programs_select_org"
  ON public.programs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
    )
  );

CREATE POLICY "programs_insert_admin_instructor"
  ON public.programs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "programs_update_admin_instructor"
  ON public.programs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "programs_delete_admin"
  ON public.programs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- 8. PROGRAM PARTICIPANTS TABLE
-- ==========================================
-- Drop existing participant policies
DROP POLICY IF EXISTS "participants_select_own_or_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_insert_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_update_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_select_organization" ON public.program_participants;
DROP POLICY IF EXISTS "participants_manage_authorized" ON public.program_participants;

-- Create clean participant policies
CREATE POLICY "participants_select_org"
  ON public.program_participants FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      JOIN public.programs ON programs.id = program_participants.program_id
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "participants_insert_admin_instructor"
  ON public.program_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      JOIN public.programs ON programs.id = program_participants.program_id
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role IN ('admin', 'instructor')
    )
  );

CREATE POLICY "participants_update_admin_instructor"
  ON public.program_participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      JOIN public.programs ON programs.id = program_participants.program_id
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = programs.organization_id
      AND profiles.role IN ('admin', 'instructor')
    )
  );

-- ==========================================
-- 9. INVITATIONS TABLE
-- ==========================================
-- Drop existing invitation policies
DROP POLICY IF EXISTS "invitations_select_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_select_by_email" ON public.invitations;

-- Create clean invitation policies
CREATE POLICY "invitations_select_admin"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_insert_admin"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_update_admin"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_delete_admin"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "invitations_select_by_email"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT users.email
      FROM auth.users
      WHERE users.id = auth.uid()
    )
  );