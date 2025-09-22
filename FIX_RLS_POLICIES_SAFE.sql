/* 
🔧 SAFE FIX RLS POLICIES FOR USER METADATA ARCHITECTURE
   
   PROBLEM: "new row violates row-level security policy for table 'programs'"
   CAUSE: RLS policies still reference the dropped profiles table
   SOLUTION: Safely update all RLS policies to use user metadata instead of profiles joins
   
   This version handles existing policies safely.
*/

-- STEP 1: Drop ALL existing RLS policies for programs table
DROP POLICY IF EXISTS "Users can view programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can insert programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can update programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can delete programs in their organization" ON programs;
DROP POLICY IF EXISTS "Admins can manage all programs" ON programs;
DROP POLICY IF EXISTS "Instructors can manage their programs" ON programs;
DROP POLICY IF EXISTS "Students can view their enrolled programs" ON programs;
DROP POLICY IF EXISTS "Admins can insert programs" ON programs;
DROP POLICY IF EXISTS "Instructors can insert programs" ON programs;
DROP POLICY IF EXISTS "Admins and instructors can update programs" ON programs;
DROP POLICY IF EXISTS "Admins can delete programs" ON programs;
DROP POLICY IF EXISTS "programs_delete_admin_metadata" ON programs;
DROP POLICY IF EXISTS "programs_insert_admin_metadata" ON programs;
DROP POLICY IF EXISTS "programs_select_org_metadata" ON programs;
DROP POLICY IF EXISTS "programs_update_admin_metadata" ON programs;

-- STEP 2: Create new RLS policies using user metadata
-- Allow users to view programs in their organization
CREATE POLICY "programs_select_by_org" ON programs
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Allow admins to insert programs in their organization
CREATE POLICY "programs_insert_admin" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Allow instructors to insert programs in their organization
CREATE POLICY "programs_insert_instructor" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'instructor' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Allow admins and instructors to update programs in their organization
CREATE POLICY "programs_update_admin_instructor" ON programs
    FOR UPDATE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- Allow admins to delete programs in their organization
CREATE POLICY "programs_delete_admin" ON programs
    FOR DELETE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') = 'admin'
    );

-- STEP 3: Fix other tables that might have similar RLS issues
-- Update announcements policies
DROP POLICY IF EXISTS "Users can view announcements in their organization" ON announcements;
DROP POLICY IF EXISTS "Users can insert announcements in their organization" ON announcements;
DROP POLICY IF EXISTS "Admins and instructors can insert announcements" ON announcements;

CREATE POLICY "announcements_select_by_org" ON announcements
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "announcements_insert_admin_instructor" ON announcements
    FOR INSERT
    WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- Update documents policies
DROP POLICY IF EXISTS "Users can view documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their organization" ON documents;

CREATE POLICY "documents_select_by_org" ON documents
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "documents_insert_by_org" ON documents
    FOR INSERT
    WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- STEP 4: Verification - Check if policies are working
SELECT 'RLS policies updated successfully!' as status;

-- Show current policies for programs table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'programs' 
ORDER BY policyname;