-- Create invitations table for the admin panel
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- Create the invitations table
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

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "invitations_select_own_org" ON public.invitations
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    OR invited_by = auth.uid()
  );

CREATE POLICY "invitations_insert_admin" ON public.invitations
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'staff')
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "invitations_update_own" ON public.invitations  
  FOR UPDATE USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    OR invited_by = auth.uid()
  );

CREATE POLICY "invitations_delete_admin" ON public.invitations
  FOR DELETE USING (
    (auth.jwt() ->> 'role') IN ('admin', 'staff')
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- Verify table was created
SELECT 'Invitations table created successfully' as status,
       table_name,
       column_name,
       data_type
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;