/* 
🔍 DEBUG USER METADATA AND RLS POLICIES
   
   This script will help us understand:
   1. What's in your JWT user metadata
   2. What role you have
   3. What organization_id you have
   4. Which policies are currently active on programs table
*/

-- STEP 1: Check what's in your current user's JWT metadata
SELECT 'CURRENT USER JWT METADATA:' as debug_info;
SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as user_role,
    auth.jwt() ->> 'organization_id' as organization_id,
    auth.jwt() ->> 'first_name' as first_name,
    auth.jwt() ->> 'last_name' as last_name,
    auth.jwt() as full_jwt_payload;

-- STEP 2: Check if you're properly authenticated
SELECT 'AUTHENTICATION CHECK:' as debug_info;
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'Authenticated ✅'
        ELSE 'Not Authenticated ❌'
    END as auth_status;

-- STEP 3: Check all current RLS policies on programs table
SELECT 'CURRENT PROGRAMS TABLE POLICIES:' as debug_info;
SELECT 
    policyname,
    cmd as operation,
    CASE 
        WHEN cmd = 'INSERT' THEN with_check
        ELSE qual
    END as policy_condition
FROM pg_policies 
WHERE tablename = 'programs' 
ORDER BY cmd, policyname;

-- STEP 4: Test if your user can insert into programs based on current policies
SELECT 'ROLE CHECK FOR PROGRAM INSERTION:' as debug_info;
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' THEN 'Admin role detected - should be able to insert ✅'
        WHEN (auth.jwt() ->> 'role') = 'instructor' THEN 'Instructor role detected - should be able to insert ✅'
        WHEN (auth.jwt() ->> 'role') = 'student' THEN 'Student role detected - cannot insert ❌'
        WHEN (auth.jwt() ->> 'role') IS NULL THEN 'No role in metadata - cannot insert ❌'
        ELSE CONCAT('Unknown role: ', (auth.jwt() ->> 'role'), ' - check policy ⚠️')
    END as role_check;

-- STEP 5: Test organization_id check
SELECT 'ORGANIZATION CHECK:' as debug_info;
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'organization_id') IS NOT NULL THEN 
            CONCAT('Organization ID found: ', (auth.jwt() ->> 'organization_id'), ' ✅')
        ELSE 'No organization_id in metadata - cannot insert ❌'
    END as org_check;

-- STEP 6: Simulate the exact policy conditions for INSERT
SELECT 'POLICY SIMULATION:' as debug_info;
SELECT 
    -- Test admin insert policy
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' AND (auth.jwt() ->> 'organization_id') IS NOT NULL THEN
            'Admin insert policy would PASS ✅'
        ELSE 'Admin insert policy would FAIL ❌'
    END as admin_insert_test,
    
    -- Test instructor insert policy  
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'instructor' AND (auth.jwt() ->> 'organization_id') IS NOT NULL THEN
            'Instructor insert policy would PASS ✅'
        ELSE 'Instructor insert policy would FAIL ❌'
    END as instructor_insert_test;