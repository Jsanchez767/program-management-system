-- Populate instructor metadata for existing users
-- This ensures any existing instructor records in profiles table have their metadata updated

DO $$
DECLARE
    instructor_record RECORD;
    org_id UUID;
BEGIN
    -- Loop through all instructor profiles and update their user metadata
    FOR instructor_record IN 
        SELECT p.id, p.first_name, p.last_name, p.organization_id, u.email, u.raw_user_meta_data
        FROM profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.role = 'instructor'
    LOOP
        -- Update user metadata with instructor info and organization
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', 'instructor',
                'first_name', instructor_record.first_name,
                'last_name', instructor_record.last_name,
                'organization_id', instructor_record.organization_id::text
            )
        WHERE id = instructor_record.id;
        
        RAISE NOTICE 'Updated instructor metadata for user %: % %', 
            instructor_record.id, 
            instructor_record.first_name, 
            instructor_record.last_name;
    END LOOP;
    
    -- Also update any admin users
    FOR instructor_record IN 
        SELECT p.id, p.first_name, p.last_name, p.organization_id, u.email, u.raw_user_meta_data
        FROM profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.role = 'admin'
    LOOP
        -- Update user metadata with admin info and organization
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', 'admin',
                'first_name', instructor_record.first_name,
                'last_name', instructor_record.last_name,
                'organization_id', instructor_record.organization_id::text
            )
        WHERE id = instructor_record.id;
        
        RAISE NOTICE 'Updated admin metadata for user %: % %', 
            instructor_record.id, 
            instructor_record.first_name, 
            instructor_record.last_name;
    END LOOP;
    
    -- Update student users as well
    FOR instructor_record IN 
        SELECT p.id, p.first_name, p.last_name, p.organization_id, u.email, u.raw_user_meta_data
        FROM profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.role = 'student'
    LOOP
        -- Update user metadata with student info and organization
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', 'student',
                'first_name', instructor_record.first_name,
                'last_name', instructor_record.last_name,
                'organization_id', instructor_record.organization_id::text
            )
        WHERE id = instructor_record.id;
        
        RAISE NOTICE 'Updated student metadata for user %: % %', 
            instructor_record.id, 
            instructor_record.first_name, 
            instructor_record.last_name;
    END LOOP;
    
    RAISE NOTICE 'Completed metadata migration for all users';
END $$;