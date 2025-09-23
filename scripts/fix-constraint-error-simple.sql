-- Fix Foreign Key Constraint Error: programs_organization_id_fkey
-- This fixes the specific error you're seeing when creating activities

SELECT exec_sql('
-- Drop the old programs_organization_id_fkey constraint if it exists
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS programs_organization_id_fkey;
');

SELECT exec_sql('
-- Add the correct activities_organization_id_fkey constraint
ALTER TABLE public.activities 
ADD CONSTRAINT activities_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
');

SELECT exec_sql('
-- Drop the old programs_staff_id_fkey constraint if it exists  
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS programs_staff_id_fkey;
');

SELECT exec_sql('
-- Add the correct activities_staff_id_fkey constraint
ALTER TABLE public.activities 
ADD CONSTRAINT activities_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES auth.users(id) ON DELETE SET NULL;
');

-- Verify the fix worked
SELECT exec_sql('
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = ''activities''
  AND constraint_type IN (''FOREIGN KEY'', ''PRIMARY KEY'')
ORDER BY constraint_name;
') as verification_result;