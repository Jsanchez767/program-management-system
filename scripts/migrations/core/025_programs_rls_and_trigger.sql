-- Enable RLS on programs table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- RLS policy: Only allow admins/instructors to insert programs in their org
CREATE POLICY "Allow admins and instructors in their org to insert programs"
  ON public.programs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' IN ('admin', 'instructor')
        AND raw_user_meta_data->>'organization_id' = organization_id::text
    )
  );

-- Optional: Automatically set organization_id from authenticated user
CREATE OR REPLACE FUNCTION public.set_program_organization_id()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := (auth.jwt() ->> 'organization_id')::UUID;
  IF v_org_id IS NULL THEN
    SELECT (raw_user_meta_data->>'organization_id')::UUID
    INTO v_org_id
    FROM auth.users WHERE id = auth.uid();
  END IF;
  NEW.organization_id := v_org_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_program_organization_id_trigger ON public.programs;
CREATE TRIGGER set_program_organization_id_trigger
  BEFORE INSERT ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_program_organization_id();
