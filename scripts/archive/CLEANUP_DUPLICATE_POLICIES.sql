-- CLEANUP DUPLICATE RLS POLICIES
-- Remove redundant organization policies and keep only the necessary ones

-- Drop the duplicate "Users can *" policies (these are redundant with metadata policies)
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;

-- Drop the "_simple" policies (these use auth.uid() which doesn't work with our metadata approach)
DROP POLICY IF EXISTS "organizations_insert_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_select_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_update_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_simple" ON organizations;

-- Keep only the metadata-based policies that work with our architecture:
-- organizations_select_own_metadata (allows viewing org by ID or if you're admin)
-- organizations_insert_admin_metadata (allows creating if you're the admin)
-- organizations_update_admin_metadata (allows updating if you're the admin)

-- Add missing DELETE policy for consistency
CREATE POLICY "organizations_delete_admin_metadata" ON organizations
    FOR DELETE
    TO public
    USING (admin_id = auth.uid());

-- Summary of final organization policies:
-- 1. organizations_select_own_metadata: View org if you belong to it or are admin
-- 2. organizations_insert_admin_metadata: Create org if you're the admin
-- 3. organizations_update_admin_metadata: Update org if you're the admin  
-- 4. organizations_delete_admin_metadata: Delete org if you're the admin

-- Verify policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'organizations' 
ORDER BY cmd, policyname;