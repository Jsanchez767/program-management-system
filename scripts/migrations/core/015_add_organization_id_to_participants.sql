-- Migration: Add organization_id to program_participants table for better reporting and performance
-- This denormalizes the data structure but provides significant benefits for multi-tenant reporting

-- Step 1: Add organization_id column to program_participants
ALTER TABLE public.program_participants 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Step 2: Populate the organization_id from the related program
UPDATE public.program_participants 
SET organization_id = programs.organization_id
FROM public.programs 
WHERE program_participants.program_id = programs.id
AND program_participants.organization_id IS NULL;

-- Step 3: Make organization_id NOT NULL after population
ALTER TABLE public.program_participants 
ALTER COLUMN organization_id SET NOT NULL;

-- Step 4: Create index for fast organization-based queries
CREATE INDEX IF NOT EXISTS idx_program_participants_organization_id 
ON public.program_participants(organization_id);

-- Step 5: Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_program_participants_org_program 
ON public.program_participants(organization_id, program_id);

CREATE INDEX IF NOT EXISTS idx_program_participants_org_student 
ON public.program_participants(organization_id, student_id);

-- Step 6: Create trigger to ensure data consistency
-- This ensures organization_id matches the program's organization
CREATE OR REPLACE FUNCTION validate_participant_organization()
RETURNS TRIGGER AS $$
DECLARE
    program_org_id UUID;
BEGIN
    -- Get the organization_id from the program
    SELECT organization_id INTO program_org_id
    FROM public.programs 
    WHERE id = NEW.program_id;
    
    -- Check if the participant's organization_id matches the program's organization_id
    IF NEW.organization_id != program_org_id THEN
        RAISE EXCEPTION 'Participant organization_id (%) does not match program organization_id (%)', 
                       NEW.organization_id, program_org_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_participant_organization
  BEFORE INSERT OR UPDATE ON public.program_participants
  FOR EACH ROW
  EXECUTE FUNCTION validate_participant_organization();

-- Step 7: Create trigger to automatically set organization_id when inserting
CREATE OR REPLACE FUNCTION set_participant_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set organization_id from the program
  SELECT organization_id INTO NEW.organization_id
  FROM public.programs 
  WHERE id = NEW.program_id;
  
  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Cannot add participant: program organization_id not found';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_participant_organization_id
  BEFORE INSERT ON public.program_participants
  FOR EACH ROW
  EXECUTE FUNCTION set_participant_organization_id();

-- Step 8: Update RLS policies to use direct organization_id (much simpler!)
DROP POLICY IF EXISTS "program_participants_select_org_metadata" ON public.program_participants;
DROP POLICY IF EXISTS "program_participants_insert_org_metadata" ON public.program_participants;
DROP POLICY IF EXISTS "program_participants_update_org_metadata" ON public.program_participants;
DROP POLICY IF EXISTS "program_participants_delete_org_metadata" ON public.program_participants;

-- New simplified RLS policies using direct organization_id
CREATE POLICY "program_participants_select_org_metadata"
  ON public.program_participants FOR SELECT
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "program_participants_insert_org_metadata"
  ON public.program_participants FOR INSERT
  WITH CHECK (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND auth.jwt() ->> 'role' IN ('admin', 'instructor')
  );

CREATE POLICY "program_participants_update_org_metadata"
  ON public.program_participants FOR UPDATE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND auth.jwt() ->> 'role' IN ('admin', 'instructor')
  );

CREATE POLICY "program_participants_delete_org_metadata"
  ON public.program_participants FOR DELETE
  USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
    AND auth.jwt() ->> 'role' IN ('admin', 'instructor')
  );

-- Example queries that are now much faster:
/*
-- Admin reporting: All participants in my organization
SELECT * FROM program_participants 
WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid;

-- Cross-table reporting: Programs with participant counts
SELECT 
  p.name as program_name,
  COUNT(pp.id) as participant_count,
  pp.organization_id
FROM programs p
LEFT JOIN program_participants pp ON p.id = pp.program_id
WHERE p.organization_id = (auth.jwt() ->> 'organization_id')::uuid
GROUP BY p.id, p.name, pp.organization_id;

-- Performance: No JOINs needed for organization filtering!
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully added organization_id to program_participants!';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '- Faster queries (no JOINs needed)';
    RAISE NOTICE '- Simpler RLS policies';
    RAISE NOTICE '- Better for admin reporting';
    RAISE NOTICE '- Consistent with other tables';
END $$;