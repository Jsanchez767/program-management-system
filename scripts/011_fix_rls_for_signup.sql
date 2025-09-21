-- Temporary fix for profile creation during signup
-- Run this in Supabase SQL Editor to allow profile creation

-- Temporarily allow profile insertion without authentication (for signup process)
CREATE POLICY "allow_profile_creation" ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Also ensure the existing policies work correctly
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);

-- Make sure we can read profiles for the dashboard redirect
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id OR auth.uid() IS NULL);

-- Enable updated_at trigger if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();