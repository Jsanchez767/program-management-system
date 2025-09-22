/* 
🔧 FIX USER METADATA FOR PROGRAM CREATION
   
   PROBLEM: User's JWT metadata is missing role and/or organization_id
   SOLUTION: Update the current user's metadata to include admin role and organization
   
   This script will fix your user metadata so you can create programs.
*/

-- First, let's see what we're working with
SELECT 'CURRENT USER DATA:' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as current_role,
    raw_user_meta_data->>'organization_id' as current_org_id
FROM auth.users 
WHERE id = auth.uid();

-- Get or create an organization for this user
DO $$
DECLARE
    current_user_id uuid;
    user_email text;
    org_id uuid;
    org_exists boolean;
BEGIN
    -- Get current user info
    SELECT auth.uid() INTO current_user_id;
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    RAISE NOTICE 'Processing user: % with email: %', current_user_id, user_email;
    
    -- Check if user already has an organization
    SELECT EXISTS(
        SELECT 1 FROM public.organizations 
        WHERE admin_id = current_user_id
    ) INTO org_exists;
    
    IF org_exists THEN
        -- Get existing organization
        SELECT id INTO org_id 
        FROM public.organizations 
        WHERE admin_id = current_user_id
        LIMIT 1;
        
        RAISE NOTICE 'Found existing organization: %', org_id;
    ELSE
        -- Create new organization
        INSERT INTO public.organizations (name, domain, admin_id)
        VALUES (
            COALESCE(user_email || '''s Organization', 'Default Organization'),
            COALESCE(split_part(user_email, '@', 1) || '-' || extract(epoch from now())::text || '.local', 'default.local'),
            current_user_id
        )
        RETURNING id INTO org_id;
        
        RAISE NOTICE 'Created new organization: %', org_id;
    END IF;
    
    -- Update user metadata with role and organization (only raw_user_meta_data)
    UPDATE auth.users 
    SET 
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'role', 'admin',
            'organization_id', org_id::text,
            'first_name', COALESCE((raw_user_meta_data->>'first_name'), split_part(user_email, '@', 1)),
            'last_name', COALESCE((raw_user_meta_data->>'last_name'), 'User')
        )
    WHERE id = current_user_id;
    
    RAISE NOTICE 'Updated user metadata with admin role and organization: %', org_id;
END $$;

-- Verify the update worked
SELECT 'UPDATED USER DATA:' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as role_in_metadata,
    raw_user_meta_data->>'organization_id' as org_id_in_metadata
FROM auth.users 
WHERE id = auth.uid();

-- Test the JWT metadata now
SELECT 'JWT METADATA AFTER UPDATE:' as info;
SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as user_role,
    auth.jwt() ->> 'organization_id' as organization_id,
    auth.jwt() ->> 'first_name' as first_name,
    auth.jwt() ->> 'last_name' as last_name;

-- Test if policies would pass now
SELECT 'POLICY TEST AFTER UPDATE:' as info;
SELECT 
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'admin' AND (auth.jwt() ->> 'organization_id') IS NOT NULL THEN
            'Admin insert policy would PASS ✅'
        ELSE 'Admin insert policy would FAIL ❌'
    END as admin_insert_test,
    
    CASE 
        WHEN (auth.jwt() ->> 'role') = 'instructor' AND (auth.jwt() ->> 'organization_id') IS NOT NULL THEN
            'Instructor insert policy would PASS ✅'
        ELSE 'Instructor insert policy would FAIL ❌'
    END as instructor_insert_test;

SELECT '🎉 User metadata has been updated! You should now be able to create programs.' as success_message;