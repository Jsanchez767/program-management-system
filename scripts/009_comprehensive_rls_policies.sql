-- Comprehensive Row Level Security (RLS) Policies
-- Run this script in your Supabase SQL editor to set up all security policies

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_trips ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is instructor
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'instructor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_select_all" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles_admin_select_all" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Instructors can view student profiles in their programs
CREATE POLICY "profiles_instructor_view_students" ON public.profiles
  FOR SELECT USING (
    public.is_instructor() AND role = 'student' AND
    EXISTS (
      SELECT 1 FROM public.program_participants pp
      JOIN public.programs p ON p.id = pp.program_id
      WHERE pp.student_id = profiles.id 
      AND p.instructor_id = auth.uid()
    )
  );

-- =============================================================================
-- PROGRAMS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "programs_select_all" ON public.programs;
DROP POLICY IF EXISTS "programs_insert_admin_instructor" ON public.programs;
DROP POLICY IF EXISTS "programs_update_admin_instructor" ON public.programs;
DROP POLICY IF EXISTS "programs_delete_admin" ON public.programs;

-- All authenticated users can view programs
CREATE POLICY "programs_select_all" ON public.programs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins and instructors can create programs
CREATE POLICY "programs_insert_admin_instructor" ON public.programs
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_instructor()
  );

-- Admins can update any program, instructors can update their own
CREATE POLICY "programs_update_admin_instructor" ON public.programs
  FOR UPDATE USING (
    public.is_admin() OR 
    (public.is_instructor() AND instructor_id = auth.uid())
  );

-- Only admins can delete programs
CREATE POLICY "programs_delete_admin" ON public.programs
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- PROGRAM_PARTICIPANTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "participants_select_own_or_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_insert_admin_instructor" ON public.program_participants;
DROP POLICY IF EXISTS "participants_update_admin_instructor" ON public.program_participants;

-- Students can view their own enrollments, instructors can view their program participants, admins can view all
CREATE POLICY "participants_select_own_or_admin_instructor" ON public.program_participants
  FOR SELECT USING (
    student_id = auth.uid() OR
    public.is_admin() OR
    (public.is_instructor() AND EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    ))
  );

-- Admins and instructors can enroll students
CREATE POLICY "participants_insert_admin_instructor" ON public.program_participants
  FOR INSERT WITH CHECK (
    public.is_admin() OR
    (public.is_instructor() AND EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    ))
  );

-- Admins and instructors can update participant status
CREATE POLICY "participants_update_admin_instructor" ON public.program_participants
  FOR UPDATE USING (
    public.is_admin() OR
    (public.is_instructor() AND EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    ))
  );

-- =============================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "announcements_select_published" ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_own_or_admin" ON public.announcements;

-- Users can view published announcements targeted to them
CREATE POLICY "announcements_select_published" ON public.announcements
  FOR SELECT USING (
    is_published = true AND
    (expires_at IS NULL OR expires_at > now()) AND
    (
      target_audience = 'all' OR
      (target_audience = 'students' AND public.is_student()) OR
      (target_audience = 'instructors' AND public.is_instructor()) OR
      (target_audience = 'program_specific' AND program_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.program_participants pp
        WHERE pp.student_id = auth.uid() AND pp.program_id = announcements.program_id
      ))
    )
  );

-- Authors and admins can view all their announcements
CREATE POLICY "announcements_select_own_or_admin" ON public.announcements
  FOR SELECT USING (
    author_id = auth.uid() OR public.is_admin()
  );

-- Admins and instructors can create announcements
CREATE POLICY "announcements_insert_admin_instructor" ON public.announcements
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_instructor()
  );

-- Authors and admins can update announcements
CREATE POLICY "announcements_update_own_or_admin" ON public.announcements
  FOR UPDATE USING (
    author_id = auth.uid() OR public.is_admin()
  );

-- =============================================================================
-- DOCUMENTS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "documents_select_own_or_admin_instructor" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documents_update_own_or_admin" ON public.documents;

-- Students can view their own documents, instructors can view documents from their program students, admins can view all
CREATE POLICY "documents_select_own_or_admin_instructor" ON public.documents
  FOR SELECT USING (
    student_id = auth.uid() OR
    public.is_admin() OR
    (public.is_instructor() AND (
      program_id IS NULL OR EXISTS (
        SELECT 1 FROM public.programs p 
        WHERE p.id = program_id AND p.instructor_id = auth.uid()
      )
    ))
  );

-- Students can upload their own documents
CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (
    student_id = auth.uid() AND public.is_student()
  );

-- Students can update their own documents, admins and instructors can update document status/notes
CREATE POLICY "documents_update_own_or_admin" ON public.documents
  FOR UPDATE USING (
    student_id = auth.uid() OR
    public.is_admin() OR
    (public.is_instructor() AND (
      program_id IS NULL OR EXISTS (
        SELECT 1 FROM public.programs p 
        WHERE p.id = program_id AND p.instructor_id = auth.uid()
      )
    ))
  );

-- =============================================================================
-- LESSON_PLANS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "lesson_plans_select_own_or_admin" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_insert_own_instructor" ON public.lesson_plans;
DROP POLICY IF EXISTS "lesson_plans_update_own_or_admin" ON public.lesson_plans;

-- Instructors can view their own lesson plans, admins can view all
CREATE POLICY "lesson_plans_select_own_or_admin" ON public.lesson_plans
  FOR SELECT USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- Instructors can create lesson plans for their programs
CREATE POLICY "lesson_plans_insert_own_instructor" ON public.lesson_plans
  FOR INSERT WITH CHECK (
    instructor_id = auth.uid() AND 
    public.is_instructor() AND
    EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    )
  );

-- Instructors can update their own lesson plans, admins can update all
CREATE POLICY "lesson_plans_update_own_or_admin" ON public.lesson_plans
  FOR UPDATE USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- =============================================================================
-- PURCHASE_ORDERS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "purchase_orders_select_own_or_admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_own_instructor" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_own_or_admin" ON public.purchase_orders;

-- Instructors can view their own purchase orders, admins can view all
CREATE POLICY "purchase_orders_select_own_or_admin" ON public.purchase_orders
  FOR SELECT USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- Instructors can create purchase orders for their programs
CREATE POLICY "purchase_orders_insert_own_instructor" ON public.purchase_orders
  FOR INSERT WITH CHECK (
    instructor_id = auth.uid() AND 
    public.is_instructor() AND
    EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    )
  );

-- Instructors can update their own purchase orders, admins can update all
CREATE POLICY "purchase_orders_update_own_or_admin" ON public.purchase_orders
  FOR UPDATE USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- =============================================================================
-- FIELD_TRIPS TABLE POLICIES
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "field_trips_select_own_or_admin" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_insert_own_instructor" ON public.field_trips;
DROP POLICY IF EXISTS "field_trips_update_own_or_admin" ON public.field_trips;

-- Instructors can view their own field trips, admins can view all
CREATE POLICY "field_trips_select_own_or_admin" ON public.field_trips
  FOR SELECT USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- Instructors can create field trips for their programs
CREATE POLICY "field_trips_insert_own_instructor" ON public.field_trips
  FOR INSERT WITH CHECK (
    instructor_id = auth.uid() AND 
    public.is_instructor() AND
    EXISTS (
      SELECT 1 FROM public.programs p 
      WHERE p.id = program_id AND p.instructor_id = auth.uid()
    )
  );

-- Instructors can update their own field trips, admins can update all
CREATE POLICY "field_trips_update_own_or_admin" ON public.field_trips
  FOR UPDATE USING (
    instructor_id = auth.uid() OR public.is_admin()
  );

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on all tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.programs;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.program_participants;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.program_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.announcements;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.documents;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.lesson_plans;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.lesson_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.purchase_orders;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.field_trips;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.field_trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();