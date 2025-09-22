-- Create an RPC function to insert programs (bypass RLS)
CREATE OR REPLACE FUNCTION public.insert_program_admin(
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_max_participants INTEGER,
  p_instructor_id UUID,
  p_status TEXT,
  p_organization_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This means it will run with the privileges of the function creator
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_org_id UUID;
  v_program_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Only proceed if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get user role from JWT claims
  v_role := (auth.jwt() ->> 'role');
  v_org_id := (auth.jwt() ->> 'organization_id')::UUID;
  
  -- Log information for debugging
  RAISE NOTICE 'User: %, Role: %, Organization: %, Target Organization: %', 
    v_user_id, v_role, v_org_id, p_organization_id;
  
  -- Only admins or instructors can create programs
  IF v_role NOT IN ('admin', 'instructor') THEN
    RAISE EXCEPTION 'Only admins and instructors can create programs';
  END IF;
  
  -- If organization_id from JWT doesn't match, use the one from JWT
  -- This ensures users can only create programs in their own organization
  IF v_org_id IS NOT NULL AND v_org_id != p_organization_id THEN
    RAISE NOTICE 'Overriding organization_id from % to % (from JWT)', p_organization_id, v_org_id;
    p_organization_id := v_org_id;
  END IF;
  
  -- Insert the program
  INSERT INTO public.programs (
    name, 
    description,
    category,
    start_date,
    end_date,
    max_participants,
    instructor_id,
    status,
    current_participants,
    organization_id
  ) VALUES (
    p_name,
    p_description,
    p_category,
    p_start_date,
    p_end_date,
    p_max_participants,
    p_instructor_id,
    p_status,
    0,
    p_organization_id
  )
  RETURNING id INTO v_program_id;
  
  RETURN v_program_id;
END;
$$;