-- ===============================================
-- DUPLICATE POLICY CLEANUP FOR ORGANIZATIONS
-- ===============================================
-- Execute this script in the Supabase SQL Editor
-- to remove duplicate RLS policies

-- First, let's see what we currently have
SELECT 
  policyname, 
  cmd, 
  CASE 
    WHEN policyname LIKE '%simple%' THEN 'auth.uid() approach'
    WHEN policyname LIKE '%metadata%' THEN 'JWT metadata approach'
    WHEN policyname LIKE 'Users can%' THEN 'Duplicate metadata approach'
    ELSE 'Other'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'organizations' 
ORDER BY cmd, policyname;

-- Drop duplicate "Users can *" policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can insert their organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;

-- Drop incompatible "_simple" policies (they use auth.uid() directly)
DROP POLICY IF EXISTS "organizations_insert_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_select_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_update_simple" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_simple" ON organizations;

-- Add missing DELETE policy for completeness
CREATE POLICY "organizations_delete_admin_metadata" ON organizations
    FOR DELETE
    TO public
    USING (admin_id = auth.uid());

-- Verify final clean state
SELECT 
  policyname, 
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN '👀 Read access'
    WHEN 'INSERT' THEN '➕ Create access'
    WHEN 'UPDATE' THEN '✏️ Modify access'
    WHEN 'DELETE' THEN '🗑️ Remove access'
  END as description
FROM pg_policies 
WHERE tablename = 'organizations' 
ORDER BY cmd, policyname;

-- Expected final result: 4 clean policies
-- 1. organizations_select_own_metadata (SELECT)
-- 2. organizations_insert_admin_metadata (INSERT)  
-- 3. organizations_update_admin_metadata (UPDATE)
-- 4. organizations_delete_admin_metadata (DELETE)