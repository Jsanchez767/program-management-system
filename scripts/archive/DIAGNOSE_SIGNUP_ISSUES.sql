-- Diagnostic script to check signup-related database issues
-- Run this in Supabase SQL Editor to identify problems

-- 1. Check if handle_new_user function exists and works
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 2. Check auth.users table permissions
SELECT 
    tablename,
    schemaname,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- 3. Check organizations table structure and permissions
\d organizations;

-- 4. Test organization creation manually
INSERT INTO organizations (name, domain, admin_id) 
VALUES ('Test Org', 'test-' || extract(epoch from now()), '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING
RETURNING id, name;

-- 5. Check RLS policies on organizations
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'organizations';

-- 6. Check if we can update user metadata (simulate the signup process)
SELECT auth.jwt();
SELECT auth.uid();