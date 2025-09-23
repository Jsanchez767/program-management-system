-- Populate staff metadata for existing users
-- This ensures any existing staff records in profiles table have their metadata updated

DO $$
DECLARE
    staff_record RECORD;
    org_id UUID;
BEGIN
    -- Loop through all staff profiles and update their user metadata
    FOR staff_record IN 
        SELECT p.id, p.first_name, p.last_name, p.organization_id, u.email, u.raw_user_meta_data
        FROM profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.role = 'staff'
    LOOP
        -- Update user metadata with staff info and organization
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', 'staff',
                'first_name', staff_record.first_name,
                'last_name', staff_record.last_name,
                'organization_id', staff_record.organization_id::text
            )
        WHERE id = staff_record.id;
        
        RAISE NOTICE 'Updated staff metadata for user %: % %', 
            staff_record.id, 
            staff_record.first_name, 
            staff_record.last_name;
    END LOOP;
    
    -- Also update any admin users
    FOR staff_record IN 
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
                'first_name', staff_record.first_name,
                'last_name', staff_record.last_name,
                'organization_id', staff_record.organization_id::text
            )
        WHERE id = staff_record.id;
        
        RAISE NOTICE 'Updated admin metadata for user %: % %', 
            staff_record.id, 
            staff_record.first_name, 
            staff_record.last_name;
    END LOOP;
    
    -- Update student users as well
    FOR staff_record IN 
        SELECT p.id, p.first_name, p.last_name, p.organization_id, u.email, u.raw_user_meta_data
        FROM profiles p
        JOIN auth.users u ON p.id = u.id
        WHERE p.role = 'participant'
    LOOP
        -- Update user metadata with student info and organization
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', 'participant',
                'first_name', staff_record.first_name,
                'last_name', staff_record.last_name,
                'organization_id', staff_record.organization_id::text
            )
        WHERE id = staff_record.id;
        
        RAISE NOTICE 'Updated student metadata for user %: % %', 
            staff_record.id, 
            staff_record.first_name, 
            staff_record.last_name;
    END LOOP;
    
    RAISE NOTICE 'Completed metadata migration for all users';
END $$;