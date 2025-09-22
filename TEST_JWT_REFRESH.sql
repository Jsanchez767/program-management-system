/* 
🔍 SIMPLE JWT TEST - Check if you need to refresh your session
   
   Your user metadata looks perfect in the database, but your JWT might be stale.
   This will show us if the JWT is getting the latest metadata.
*/

-- Check if the JWT has the latest metadata
SELECT 'JWT TOKEN TEST:' as info;
SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as jwt_role,
    auth.jwt() ->> 'organization_id' as jwt_org_id,
    -- Compare with database metadata
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as db_role,
    (SELECT raw_user_meta_data->>'organization_id' FROM auth.users WHERE id = auth.uid()) as db_org_id;

-- Test if policies should work with current JWT
SELECT 'POLICY TEST:' as info;
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' AND (auth.jwt() ->> 'organization_id') IS NOT NULL THEN
            'Admin policy should PASS ✅'
        ELSE 'Admin policy would FAIL ❌ - JWT role: ' || COALESCE(auth.jwt() ->> 'role', 'NULL') || ', org: ' || COALESCE(auth.jwt() ->> 'organization_id', 'NULL')
    END as admin_test;

-- If JWT doesn't match database, you need to refresh your session
SELECT 'SOLUTION:' as info;
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'role') IS NULL OR (auth.jwt() ->> 'organization_id') IS NULL THEN
            '🔄 REFRESH NEEDED: Log out and log back in to get fresh JWT token'
        ELSE '✅ JWT looks good - there might be another issue'
    END as solution;