-- Enhanced Invitations Table Setup
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- Step 1: Add missing columns to invitations table
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'user_created', 'accepted', 'expired'));

-- Step 2: Update existing rows without tokens
UPDATE public.invitations 
SET token = encode(gen_random_bytes(32), 'hex')
WHERE token IS NULL;

-- Step 3: Update existing rows without status
UPDATE public.invitations 
SET status = 'pending'
WHERE status IS NULL;

-- Step 4: Make sure RLS is enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop any existing policies
DROP POLICY IF EXISTS "invitations_select_own_org" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_own" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_all_operations" ON public.invitations;
DROP POLICY IF EXISTS "invitations_authenticated_full_access" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_authenticated" ON public.invitations;
DROP POLICY IF EXISTS "invitations_select_authenticated" ON public.invitations;
DROP POLICY IF EXISTS "invitations_modify_own" ON public.invitations;

-- Step 6: Create comprehensive policies
-- Allow authenticated users to view invitations for their organization
CREATE POLICY "invitations_select_organization" ON public.invitations
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Admin can see all invitations for their organization
      organization_id IN (
        SELECT id FROM public.organizations WHERE admin_id = auth.uid()
      ) OR
      -- Users can see invitations they created
      invited_by = auth.uid()
    )
  );

-- Allow organization admins to create invitations
CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    organization_id IN (
      SELECT id FROM public.organizations WHERE admin_id = auth.uid()
    )
  );

-- Allow organization admins and invitation creators to update invitations
CREATE POLICY "invitations_update_organization" ON public.invitations
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      organization_id IN (
        SELECT id FROM public.organizations WHERE admin_id = auth.uid()
      ) OR
      invited_by = auth.uid()
    )
  );

-- Allow organization admins to delete invitations
CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND 
    organization_id IN (
      SELECT id FROM public.organizations WHERE admin_id = auth.uid()
    )
  );

-- Step 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON public.invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Step 8: Verify setup
SELECT 'Enhanced Invitations Table Setup Complete' as status;

-- Show final table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show active policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'invitations' AND schemaname = 'public';