/* 
🔍 COMPREHENSIVE JWT AND POLICY DEBUG
   
   This will help us understand exactly what's happening with your JWT and policies.
*/

-- STEP 1: Check current user authentication
SELECT '=== USER AUTHENTICATION ===' as debug_section;
SELECT 
    auth.uid() as current_user_id,
    CASE WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated' ELSE '❌ Not authenticated' END as auth_status;

-- STEP 2: Check database user metadata
SELECT '=== DATABASE METADATA ===' as debug_section;
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as db_role,
    raw_user_meta_data->>'organization_id' as db_org_id,
    raw_user_meta_data->>'first_name' as db_first_name,
    raw_user_meta_data->>'last_name' as db_last_name
FROM auth.users 
WHERE id = auth.uid();

-- STEP 3: Check JWT payload
SELECT '=== JWT PAYLOAD ===' as debug_section;
SELECT 
    auth.jwt() as full_jwt,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() ->> 'organization_id' as jwt_org_id,
    auth.jwt() ->> 'first_name' as jwt_first_name,
    auth.jwt() ->> 'last_name' as jwt_last_name,
    auth.jwt() ->> 'aud' as jwt_audience,
    auth.jwt() ->> 'exp' as jwt_expiry;

-- STEP 4: Compare database vs JWT
SELECT '=== COMPARISON ===' as debug_section;
SELECT 
    -- Role comparison
    CASE 
        WHEN (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = (auth.jwt() ->> 'role') 
        THEN '✅ Role matches'
        ELSE '❌ Role mismatch: DB=' || COALESCE((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()), 'NULL') || ', JWT=' || COALESCE(auth.jwt() ->> 'role', 'NULL')
    END as role_comparison,
    
    -- Organization comparison
    CASE 
        WHEN (SELECT raw_user_meta_data->>'organization_id' FROM auth.users WHERE id = auth.uid()) = (auth.jwt() ->> 'organization_id') 
        THEN '✅ Organization matches'
        ELSE '❌ Organization mismatch: DB=' || COALESCE((SELECT raw_user_meta_data->>'organization_id' FROM auth.users WHERE id = auth.uid()), 'NULL') || ', JWT=' || COALESCE(auth.jwt() ->> 'organization_id', 'NULL')
    END as org_comparison;

-- STEP 5: Test each policy condition individually
SELECT '=== POLICY CONDITIONS ===' as debug_section;
SELECT 
    -- Test basic auth
    CASE WHEN auth.uid() IS NOT NULL THEN '✅' ELSE '❌' END as has_auth_uid,
    
    -- Test role
    CASE WHEN (auth.jwt() ->> 'role') = 'admin' THEN '✅' ELSE '❌' END as has_admin_role,
    CASE WHEN (auth.jwt() ->> 'role') = 'instructor' THEN '✅' ELSE '❌' END as has_instructor_role,
    
    -- Test organization
    CASE WHEN (auth.jwt() ->> 'organization_id') IS NOT NULL THEN '✅' ELSE '❌' END as has_org_id,
    
    -- Test combined conditions
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' AND (auth.jwt() ->> 'organization_id') IS NOT NULL 
        THEN '✅ Admin policy should pass'
        ELSE '❌ Admin policy will fail'
    END as admin_policy_test,
    
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'instructor' AND (auth.jwt() ->> 'organization_id') IS NOT NULL 
        THEN '✅ Instructor policy should pass'
        ELSE '❌ Instructor policy will fail'
    END as instructor_policy_test;

-- STEP 6: Check what policies exist
SELECT '=== ACTIVE POLICIES ===' as debug_section;
SELECT 
    policyname,
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'programs' AND cmd = 'INSERT'
ORDER BY policyname;

-- STEP 7: Try a direct INSERT test (this will show the exact error)
SELECT '=== DIRECT INSERT TEST ===' as debug_section;
SELECT 'About to test direct INSERT - check for error below' as test_info;

-- This should fail with the exact RLS error
-- INSERT INTO programs (name, description, organization_id) 
-- VALUES ('Test Program', 'Test Description', (auth.jwt() ->> 'organization_id')::uuid);

SELECT 'INSERT test skipped to avoid error - run manually if needed' as insert_test;