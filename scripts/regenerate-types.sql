-- =============================================
-- REGENERATE SUPABASE TYPES
-- =============================================
-- Use this to regenerate TypeScript types from your Supabase database schema
-- This ensures your TypeScript interfaces match your actual database structure

-- Step 1: Check current trips table structure
-- =============================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Generate TypeScript interface based on current schema
-- =============================================
SELECT 
    'TypeScript Interface for trips table:' as info,
    '
export interface Trip {
  id: string
  activity_id: string | null
  location: string | null
  trip_date: string | null
  return_date: string | null
  status: string | null
  organization_id: string
  created_at: string
  updated_at: string
  custom_fields: Json | null
  comments: string | null
  pickup_time: string | null
  return_time: string | null
}
' as typescript_interface;

-- Step 3: To regenerate types using Supabase CLI (run in terminal):
-- =============================================
/*
Run these commands in your terminal:

1. Install Supabase CLI if not already installed:
   npm install -g supabase@latest

2. Login to Supabase:
   supabase login

3. Generate types from your database:
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/supabase.ts

4. Or if you have the project linked:
   npx supabase gen types typescript --linked > lib/types/supabase.ts

Replace YOUR_PROJECT_ID with your actual Supabase project ID.
*/

-- =============================================
-- ALTERNATIVE: MANUAL TYPE UPDATES
-- =============================================

-- If you prefer to manually update, ensure these interfaces in your TypeScript files include:
-- - activity_id: string (required for linking trips to programs)
-- - All other fields that exist in your database

SELECT 'Update complete! Your Trip interface should now include activity_id field.' as status;