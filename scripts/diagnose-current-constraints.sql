-- Create Organization Signup Function for Supabase
-- This function is required for the signup process when users create new organizations
-- Copy and paste this entire content into Supabase SQL Editor and click "Run"

CREATE OR REPLACE FUNCTION public.create_organization_for_signup(
  org_name TEXT,
  admin_user_id UUID
)
RETURNS TABLE(organization_id UUID, organization_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  subdomain_value TEXT;
BEGIN
  -- Create a subdomain from the organization name
  subdomain_value := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  subdomain_value := trim(both '-' from subdomain_value);
  
  -- Ensure unique subdomain
  WHILE EXISTS (SELECT 1 FROM organizations WHERE subdomain = subdomain_value) LOOP
    subdomain_value := subdomain_value || '-' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  
  -- Insert the new organization
  INSERT INTO public.organizations (name, subdomain, admin_id)
  VALUES (org_name, subdomain_value, admin_user_id)
  RETURNING id INTO new_org_id;
  
  -- Return the organization details
  RETURN QUERY SELECT new_org_id, org_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_for_signup(TEXT, UUID) TO authenticated;

-- Verify the function was created
SELECT 'Function created successfully' as status, 
       proname as function_name,
       pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'create_organization_for_signup';