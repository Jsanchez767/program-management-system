-- Simple test to verify signup functionality step by step
-- Run each section separately in Supabase SQL Editor

-- Test 1: Check if we can create organizations manually
SELECT 'Testing organization creation...' as test;

INSERT INTO organizations (name, subdomain, admin_id)
VALUES (
  'Test Organization',
  'test-org-' || extract(epoch from now()),
  '12345678-1234-1234-1234-123456789012'
) RETURNING id, name, subdomain, admin_id;

-- Test 2: Check handle_new_user trigger function
SELECT 'Checking handle_new_user function...' as test;

SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test 3: Check auth triggers
SELECT 'Checking auth triggers...' as test;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth';

-- Test 4: Verify RLS is not blocking inserts
SELECT 'Checking RLS policies...' as test;

SELECT 
    schemaname,
    tablename,
    rowsecurity,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'organizations'
ORDER BY cmd;

-- Test 5: Check if service role has proper permissions
SELECT 'Checking permissions...' as test;

SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'organizations'
ORDER BY grantee, privilege_type;