-- Diagnose Foreign Key Constraint Issues
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR TO DIAGNOSE ⚠️

-- Check all foreign key constraints on activities table
SELECT 
  'Activities Table Foreign Key Constraints' as check_name,
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

-- Check if there are any constraints still referencing "programs"
SELECT 
  'Legacy Programs Constraints' as check_name,
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%programs%'
  OR constraint_name LIKE '%program_%';

-- Check the activities table structure
SELECT 
  'Activities Table Structure' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'activities'
ORDER BY ordinal_position;

-- Check if organizations table exists and its structure
SELECT 
  'Organizations Table Check' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;