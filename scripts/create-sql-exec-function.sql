-- Create SQL Execution Function for Supabase
-- ⚠️  COPY AND PASTE THIS INTO SUPABASE SQL EDITOR FIRST ⚠️
-- This creates a function that allows executing SQL from your application

BEGIN;

-- Create the exec_sql function for running SQL scripts
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with elevated privileges
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Execute the SQL and return result as JSON
  EXECUTE sql_query;
  
  -- Return success status
  SELECT json_build_object(
    'success', true,
    'message', 'SQL executed successfully',
    'query', left(sql_query, 100) || CASE WHEN length(sql_query) > 100 THEN '...' ELSE '' END
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  -- Return error information
  SELECT json_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'query', left(sql_query, 100) || CASE WHEN length(sql_query) > 100 THEN '...' ELSE '' END
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO service_role;

SELECT 'SQL execution function created successfully' as status;

COMMIT;