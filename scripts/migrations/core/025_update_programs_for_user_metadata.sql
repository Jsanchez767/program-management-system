-- Migration: Update programs table and RLS for user metadata architecture

-- 1. Remove foreign key to profiles for instructor_id
ALTER TABLE public.programs DROP CONSTRAINT IF EXISTS programs_instructor_id_fkey;

-- 2. (Optional) Change instructor_id to uuid (no reference)
-- Already uuid, so no change needed unless you want to rename or add comments

-- 3. Update RLS policies to use user metadata
DROP POLICY IF EXISTS programs_select_all ON public.programs;
DROP POLICY IF EXISTS programs_insert_admin_instructor ON public.programs;
DROP POLICY IF EXISTS programs_update_admin_instructor ON public.programs;
DROP POLICY IF EXISTS programs_delete_admin ON public.programs;

-- New policies using JWT user metadata
CREATE POLICY programs_select_by_org ON public.programs
  FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY programs_insert_admin_instructor ON public.programs
  FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'instructor')
    AND organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY programs_update_admin_instructor ON public.programs
  FOR UPDATE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND (auth.jwt() ->> 'role') IN ('admin', 'instructor')
  );

CREATE POLICY programs_delete_admin ON public.programs
  FOR DELETE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND (auth.jwt() ->> 'role') = 'admin'
  );

-- 4. Verify
-- SELECT * FROM pg_policies WHERE tablename = 'programs';
-- SELECT * FROM public.programs LIMIT 5;
