-- Check invitations table structure and create if needed
SELECT exec_sql($sql$
-- Check if invitations table exists
SELECT 
  'Invitations Table Check' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;
$sql$);

SELECT exec_sql($sql$
-- Create invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
$sql$);

SELECT exec_sql($sql$
-- Create RLS policies for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select_own_org" ON public.invitations;
CREATE POLICY "invitations_select_own_org" ON public.invitations
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    OR
    invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "invitations_insert_admin" ON public.invitations;  
CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'staff')
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

DROP POLICY IF EXISTS "invitations_update_own" ON public.invitations;
CREATE POLICY "invitations_update_own" ON public.invitations  
  FOR UPDATE USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    OR invited_by = auth.uid()
  );

DROP POLICY IF EXISTS "invitations_delete_admin" ON public.invitations;
CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'staff')
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );
$sql$);