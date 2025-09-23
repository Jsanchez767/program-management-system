-- Minimal Invitations Table Creation
-- ⚠️  COPY THIS ENTIRE CONTENT AND PASTE INTO SUPABASE SQL EDITOR ⚠️

-- Step 1: Create basic invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant',
    token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invited_by UUID,
    status TEXT DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add foreign key constraints
ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.invitations 
ADD CONSTRAINT invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create basic policy to allow all operations for now (we'll restrict later)
CREATE POLICY "invitations_all_operations" ON public.invitations
  FOR ALL USING (true) WITH CHECK (true);

-- Step 5: Verify table creation
SELECT 'Table created successfully' as status,
       COUNT(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'invitations';

-- Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;