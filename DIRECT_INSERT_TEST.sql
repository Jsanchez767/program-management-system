/* 
🔧 SIMPLE PROGRAM INSERT TEST
   
   Let's try to insert a program directly with your exact organization_id to see what happens.
*/

-- Test 1: Check if you can see your organization
SELECT '=== ORGANIZATION CHECK ===' as test;
SELECT * FROM organizations WHERE id = '1dce5174-b83d-4b93-8169-ebe842fe5fc1';

-- Test 2: Check current JWT values
SELECT '=== JWT CHECK ===' as test;
SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as role,
    auth.jwt() ->> 'organization_id' as org_id;

-- Test 3: Check if policies would allow this specific insert
SELECT '=== POLICY CHECK ===' as test;
SELECT 
    '1dce5174-b83d-4b93-8169-ebe842fe5fc1'::uuid as target_org_id,
    (auth.jwt() ->> 'organization_id')::uuid as jwt_org_id,
    CASE 
        WHEN '1dce5174-b83d-4b93-8169-ebe842fe5fc1' = (auth.jwt() ->> 'organization_id') 
        THEN '✅ Organization IDs match'
        ELSE '❌ Organization IDs do not match'
    END as org_match_test,
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' 
        THEN '✅ Has admin role'
        ELSE '❌ Not admin role: ' || COALESCE(auth.jwt() ->> 'role', 'NULL')
    END as role_test;

-- Test 4: Try the actual insert with your exact data
INSERT INTO programs (
    name, 
    description, 
    organization_id,
    status
) VALUES (
    'Test Program From SQL', 
    'Testing direct insert with admin role', 
    '1dce5174-b83d-4b93-8169-ebe842fe5fc1'::uuid,
    'active'
);

-- Test 5: Check if it worked
SELECT '=== INSERT RESULT ===' as test;
SELECT * FROM programs WHERE name = 'Test Program From SQL';

SELECT 'If you see the program above, the insert worked! The issue is in your application code, not the database policies.' as result;
