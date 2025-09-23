-- Create the exec_sql function that's missing from your Supabase instance
-- This will allow future scripts to use the programmatic execution method

-- Create the exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Grant execute permissions to authenticated users (be careful with this)
-- GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Test the function
SELECT 'exec_sql function created successfully' as result;