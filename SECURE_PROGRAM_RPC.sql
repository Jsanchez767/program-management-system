-- Secure RPC function for production
CREATE OR REPLACE FUNCTION public.insert_activity_admin(
  p_name TEXT,
  p_description TEXT,
  p_category TEXT,
  p_start_date DATE,
  p_end_date DATE,
  p_max_participants INTEGER,
  p_staff_id UUID,
  p_status TEXT,
  p_organization_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_org_id UUID;
  v_activity_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user role and organization from JWT
  v_role := auth.jwt() ->> 'role';
  v_org_id := (auth.jwt() ->> 'organization_id')::UUID;

  -- If missing, get from database
  IF v_role IS NULL OR v_org_id IS NULL THEN
    SELECT raw_user_meta_data->>'role', (raw_user_meta_data->>'organization_id')::UUID
    INTO v_role, v_org_id
    FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Only allow admins or staffs to create programs in their own org
  IF v_role NOT IN ('admin', 'staff') THEN
    RAISE EXCEPTION 'Only admins and staffs can create programs';
  END IF;
  IF v_org_id IS NULL OR v_org_id != p_organization_id THEN
    RAISE EXCEPTION 'Organization mismatch or missing';
  END IF;

  -- Insert the program
  INSERT INTO public.programs (
    name, description, category, start_date, end_date, max_participants,
    staff_id, status, current_participants, organization_id
  ) VALUES (
    p_name, p_description, p_category, p_start_date, p_end_date, p_max_participants,
    p_staff_id, p_status, 0, v_org_id
  ) RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;