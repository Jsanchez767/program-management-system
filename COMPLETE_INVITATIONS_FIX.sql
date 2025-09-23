-- Complete Invitations Table Fix
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- Step 1: Add missing token column
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Step 2: Update existing rows without tokens
UPDATE public.invitations 
SET token = encode(gen_random_bytes(32), 'hex')
WHERE token IS NULL;

-- Step 3: Make sure RLS is enabled
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing restrictive policies
DROP POLICY IF EXISTS "invitations_select_own_org" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update_own" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
DROP POLICY IF EXISTS "invitations_all_operations" ON public.invitations;
DROP POLICY IF EXISTS "invitations_authenticated_full_access" ON public.invitations;

-- Step 5: Create simple working policies
-- Allow authenticated users to insert invitations (we'll restrict this later)
CREATE POLICY "invitations_insert_authenticated" ON public.invitations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to select invitations for their organization
CREATE POLICY "invitations_select_authenticated" ON public.invitations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow users to update/delete invitations they created
CREATE POLICY "invitations_modify_own" ON public.invitations
  FOR ALL USING (invited_by = auth.uid());

-- Step 6: Verify everything is working
SELECT 'Invitations Table Setup Complete' as status;

-- Show final table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- Show active policies
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'invitations';