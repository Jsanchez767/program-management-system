-- Alternative Solution: Create Organization Signup Function with Elevated Privileges
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️
-- This creates a secure function that can create organizations during signup

BEGIN;

-- Create a secure function for organization creation during signup
CREATE OR REPLACE FUNCTION public.create_organization_for_signup(
  org_name TEXT,
  admin_user_id UUID
)
RETURNS TABLE(organization_id UUID, organization_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  subdomain_value TEXT;
BEGIN
  -- Generate subdomain from organization name
  subdomain_value := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  subdomain_value := trim(both '-' from subdomain_value);
  
  -- Ensure subdomain is unique
  WHILE EXISTS (SELECT 1 FROM organizations WHERE subdomain = subdomain_value) LOOP
    subdomain_value := subdomain_value || '-' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  
  -- Insert the organization
  INSERT INTO public.organizations (name, subdomain, admin_id)
  VALUES (org_name, subdomain_value, admin_user_id)
  RETURNING id INTO new_org_id;
  
  -- Return the result
  RETURN QUERY SELECT new_org_id, org_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_for_signup(TEXT, UUID) TO authenticated;

-- Create a more permissive temporary policy for organization access
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
CREATE POLICY "organizations_select_own"
  ON public.organizations FOR SELECT
  USING (
    -- Allow users to see their own organization
    admin_id = auth.uid()
    OR
    -- Allow users to see organization they belong to
    id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- Simplify the insert policy to only allow the function
DROP POLICY IF EXISTS "organizations_insert_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_signup_and_admin" ON public.organizations;

-- Only allow direct inserts from the signup function (security definer bypasses RLS)
-- and existing admins with proper role
CREATE POLICY "organizations_insert_restricted"
  ON public.organizations FOR INSERT
  WITH CHECK (
    -- Only allow if user has admin role and organization_id (existing admin)
    ((auth.jwt() ->> 'role') = 'admin' AND (auth.jwt() ->> 'organization_id') IS NOT NULL)
    OR
    -- Allow during signup for the admin user creating their org
    (admin_id = auth.uid() AND (auth.jwt() ->> 'organization_id') IS NULL)
  );

SELECT 'Organization signup function created successfully' as status;

COMMIT;