/* 
🔧 COMPREHENSIVE RLS POLICY CLEANUP
   
   PROBLEM: Duplicate and conflicting RLS policies causing permission errors
   ANALYSIS: Found multiple policies for same tables with different naming conventions
   SOLUTION: Remove ALL policies and recreate clean, consistent ones
   
   Based on your CSV export showing duplicate policies.
*/

-- =============================================================================
-- STEP 1: COMPLETE CLEANUP - Remove ALL existing policies
-- =============================================================================

-- Programs table - remove ALL policies
DROP POLICY IF EXISTS "programs_select_by_org" ON programs;
DROP POLICY IF EXISTS "programs_insert_admin" ON programs;
DROP POLICY IF EXISTS "programs_insert_instructor" ON programs;
DROP POLICY IF EXISTS "programs_update_admin_instructor" ON programs;
DROP POLICY IF EXISTS "programs_delete_admin" ON programs;

-- Announcements table - remove ALL policies
DROP POLICY IF EXISTS "announcements_select_by_org" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_admin_instructor" ON announcements;
DROP POLICY IF EXISTS "announcements_select_org_metadata" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_org_metadata" ON announcements;
DROP POLICY IF EXISTS "announcements_update_org_metadata" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_org_metadata" ON announcements;

-- Documents table - remove ALL policies (except storage ones)
DROP POLICY IF EXISTS "documents_select_by_org" ON documents;
DROP POLICY IF EXISTS "documents_insert_by_org" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "documents_select_org_metadata" ON documents;
DROP POLICY IF EXISTS "documents_insert_org_metadata" ON documents;
DROP POLICY IF EXISTS "documents_update_org_metadata" ON documents;
DROP POLICY IF EXISTS "documents_delete_org_metadata" ON documents;
DROP POLICY IF EXISTS "documents_insert_own" ON documents;

-- =============================================================================
-- STEP 2: CREATE CLEAN, CONSISTENT POLICIES
-- =============================================================================

-- PROGRAMS TABLE POLICIES
CREATE POLICY "programs_select_org" ON programs
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "programs_insert_admin_only" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

CREATE POLICY "programs_insert_instructor_only" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'instructor' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

CREATE POLICY "programs_update_admin_instructor_only" ON programs
    FOR UPDATE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

CREATE POLICY "programs_delete_admin_only" ON programs
    FOR DELETE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') = 'admin'
    );

-- ANNOUNCEMENTS TABLE POLICIES
CREATE POLICY "announcements_select_org" ON announcements
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "announcements_insert_admin_instructor" ON announcements
    FOR INSERT
    WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

CREATE POLICY "announcements_update_admin_instructor" ON announcements
    FOR UPDATE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

CREATE POLICY "announcements_delete_admin_instructor" ON announcements
    FOR DELETE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- DOCUMENTS TABLE POLICIES
CREATE POLICY "documents_select_org" ON documents
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "documents_insert_all_users" ON documents
    FOR INSERT
    WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "documents_update_admin_instructor" ON documents
    FOR UPDATE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

CREATE POLICY "documents_delete_admin_instructor" ON documents
    FOR DELETE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- =============================================================================
-- STEP 3: VERIFICATION
-- =============================================================================

SELECT 'All RLS policies cleaned up and recreated successfully!' as status;

-- Show all policies for key tables
SELECT 'PROGRAMS POLICIES:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'programs' 
ORDER BY policyname;

SELECT 'ANNOUNCEMENTS POLICIES:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'announcements' 
ORDER BY policyname;

SELECT 'DOCUMENTS POLICIES:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'documents' 
ORDER BY policyname;