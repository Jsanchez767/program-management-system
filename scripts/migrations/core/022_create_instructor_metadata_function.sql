-- Create a function to get instructors by organization using user metadata
-- This replaces the need to query the profiles table

CREATE OR REPLACE FUNCTION get_instructors_for_organization(org_id UUID)
RETURNS TABLE(
  id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.raw_user_meta_data ->> 'first_name' as first_name,
    u.raw_user_meta_data ->> 'last_name' as last_name,
    u.email
  FROM auth.users u
  WHERE 
    u.raw_user_meta_data ->> 'role' = 'instructor'
    AND u.raw_user_meta_data ->> 'organization_id' = org_id::text
    AND u.deleted_at IS NULL
  ORDER BY u.raw_user_meta_data ->> 'first_name';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_instructors_for_organization(UUID) TO authenticated;