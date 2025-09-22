/* 
🔧 FIX RLS POLICIES FOR USER METADATA ARCHITECTURE
   
   PROBLEM: "new row violates row-level security policy for table 'programs'"
   CAUSE: RLS policies still reference the dropped profiles table
   SOLUTION: Update all RLS policies to use user metadata instead of profiles joins
   
   Copy and paste this entire script into your Supabase SQL Editor and run it.
*/

-- STEP 1: Drop all existing RLS policies that reference profiles table
DROP POLICY IF EXISTS "Users can view programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can insert programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can update programs in their organization" ON programs;
DROP POLICY IF EXISTS "Users can delete programs in their organization" ON programs;
DROP POLICY IF EXISTS "Admins can manage all programs" ON programs;
DROP POLICY IF EXISTS "Instructors can manage their programs" ON programs;
DROP POLICY IF EXISTS "Students can view their enrolled programs" ON programs;

-- STEP 2: Create new RLS policies using user metadata
-- Allow users to view programs in their organization
CREATE POLICY "Users can view programs in their organization" ON programs
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Allow admins to insert programs in their organization
CREATE POLICY "Admins can insert programs" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'admin' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Allow instructors to insert programs in their organization
CREATE POLICY "Instructors can insert programs" ON programs
    FOR INSERT
    WITH CHECK (
        (auth.jwt() ->> 'role') = 'instructor' 
        AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
    );

-- Allow admins and instructors to update programs in their organization
CREATE POLICY "Admins and instructors can update programs" ON programs
    FOR UPDATE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- Allow admins to delete programs in their organization
CREATE POLICY "Admins can delete programs" ON programs
    FOR DELETE
    USING (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') = 'admin'
    );

-- STEP 3: Fix other tables that might have similar RLS issues
-- Update announcements policies
DROP POLICY IF EXISTS "Users can view announcements in their organization" ON announcements;
DROP POLICY IF EXISTS "Users can insert announcements in their organization" ON announcements;

CREATE POLICY "Users can view announcements in their organization" ON announcements
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Admins and instructors can insert announcements" ON announcements
    FOR INSERT
    WITH CHECK (
        organization_id = (auth.jwt() ->> 'organization_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    );

-- Update documents policies
DROP POLICY IF EXISTS "Users can view documents in their organization" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their organization" ON documents;

CREATE POLICY "Users can view documents in their organization" ON documents
    FOR SELECT
    USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert documents" ON documents
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