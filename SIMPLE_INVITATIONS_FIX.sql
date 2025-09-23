-- Simple RLS fix for invitations - make it more permissive for testing
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "invitations_select_own_org" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_own" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_all_operations" ON public.invitations;

-- Create a simple policy that allows authenticated users to do everything for testing
-- We'll make this more restrictive later once it's working
CREATE POLICY "invitations_authenticated_full_access" ON public.invitations
  FOR ALL 
  USING (auth.uid() IS NOT NULL) 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Check the policy was created
SELECT 'Policy created' as status,
       schemaname, 
       tablename, 
       policyname, 
       permissive, 
       roles, 
       cmd
FROM pg_policies 
WHERE tablename = 'invitations';

-- Test a simple insert to see if it works
-- This will fail if there are other issues besides RLS
INSERT INTO public.invitations (organization_id, email, role, invited_by) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'participant', auth.uid())
ON CONFLICT (id) DO NOTHING;

-- Check if any invitations exist
SELECT 'Invitations count' as check_type, COUNT(*) as count FROM public.invitations;