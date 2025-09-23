SELECT exec_sql($func$
CREATE OR REPLACE FUNCTION public.create_organization_for_signup(
  org_name TEXT,
  admin_user_id UUID
)
RETURNS TABLE(organization_id UUID, organization_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $body$
DECLARE
  new_org_id UUID;
  subdomain_value TEXT;
BEGIN
  subdomain_value := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  subdomain_value := trim(both '-' from subdomain_value);
  
  WHILE EXISTS (SELECT 1 FROM organizations WHERE subdomain = subdomain_value) LOOP
    subdomain_value := subdomain_value || '-' || substr(gen_random_uuid()::text, 1, 4);
  END LOOP;
  
  INSERT INTO public.organizations (name, subdomain, admin_id)
  VALUES (org_name, subdomain_value, admin_user_id)
  RETURNING id INTO new_org_id;
  
  RETURN QUERY SELECT new_org_id, org_name;
END;
$body$
$func$);