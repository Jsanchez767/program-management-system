-- Add missing token column to invitations table
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR ⚠️

-- Add the missing token column with a default value
ALTER TABLE public.invitations 
ADD COLUMN IF NOT EXISTS token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex');

-- Update existing rows that might not have tokens
UPDATE public.invitations 
SET token = encode(gen_random_bytes(32), 'hex')
WHERE token IS NULL;

-- Verify the token column was added
SELECT 
  'Token Column Added' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invitations' AND column_name = 'token';

-- Show the complete table structure
SELECT 
  'Complete Table Structure' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;