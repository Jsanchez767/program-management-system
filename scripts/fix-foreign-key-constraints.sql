-- Fix Foreign Key Constraint Issues After Programs→Activities Migration
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR AND RUN IT ⚠️
-- This fixes the foreign key constraint error when creating activities

BEGIN;

-- Drop the old foreign key constraint that still references "programs"
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS programs_organization_id_fkey;

-- Drop any other legacy program constraints
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS programs_staff_id_fkey;

ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS programs_pkey;

-- Recreate the correct foreign key constraints for activities table
ALTER TABLE public.activities 
ADD CONSTRAINT activities_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add staff_id foreign key if it doesn't exist
ALTER TABLE public.activities 
ADD CONSTRAINT activities_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Ensure activities table has a proper primary key
ALTER TABLE public.activities 
ADD CONSTRAINT activities_pkey PRIMARY KEY (id);

-- Verify the constraints were created correctly
SELECT 
  'Fixed Constraints' as status,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='activities';

COMMIT;