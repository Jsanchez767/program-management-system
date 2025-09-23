-- Update RLS policies to use auth.jwt() user metadata instead of profiles table
-- This eliminates the need for profiles table lookups in RLS policies

-- Update programs table RLS policies
DROP POLICY IF EXISTS "Users can view programs from their organization" ON programs;
DROP POLICY IF EXISTS "Users can insert programs for their organization" ON programs;
DROP POLICY IF EXISTS "Users can update programs from their organization" ON programs;
DROP POLICY IF EXISTS "Users can delete programs from their organization" ON programs;

CREATE POLICY "Users can view programs from their organization"
ON programs FOR SELECT
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert programs for their organization"
ON programs FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update programs from their organization"
ON programs FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can delete programs from their organization"
ON programs FOR DELETE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Update participants table RLS policies
DROP POLICY IF EXISTS "Users can view participants from their organization" ON participants;
DROP POLICY IF EXISTS "Users can insert participants for their organization" ON participants;
DROP POLICY IF EXISTS "Users can update participants from their organization" ON participants;
DROP POLICY IF EXISTS "Users can delete participants from their organization" ON participants;

CREATE POLICY "Users can view participants from their organization"
ON participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE activities.id = participants.activity_id 
    AND programs.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
);

CREATE POLICY "Users can insert participants for their organization"
ON participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE activities.id = participants.activity_id 
    AND programs.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
);

CREATE POLICY "Users can update participants from their organization"
ON participants FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE activities.id = participants.activity_id 
    AND programs.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE activities.id = participants.activity_id 
    AND programs.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
);

CREATE POLICY "Users can delete participants from their organization"
ON participants FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM activities 
    WHERE activities.id = participants.activity_id 
    AND programs.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  )
);

-- Update announcements table RLS policies
DROP POLICY IF EXISTS "Users can view announcements from their organization" ON announcements;
DROP POLICY IF EXISTS "Users can insert announcements for their organization" ON announcements;
DROP POLICY IF EXISTS "Users can update announcements from their organization" ON announcements;
DROP POLICY IF EXISTS "Users can delete announcements from their organization" ON announcements;

CREATE POLICY "Users can view announcements from their organization"
ON announcements FOR SELECT
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert announcements for their organization"
ON announcements FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update announcements from their organization"
ON announcements FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can delete announcements from their organization"
ON announcements FOR DELETE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Update documents table RLS policies
DROP POLICY IF EXISTS "Users can view documents from their organization" ON documents;
DROP POLICY IF EXISTS "Users can insert documents for their organization" ON documents;
DROP POLICY IF EXISTS "Users can update documents from their organization" ON documents;
DROP POLICY IF EXISTS "Users can delete documents from their organization" ON documents;

CREATE POLICY "Users can view documents from their organization"
ON documents FOR SELECT
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert documents for their organization"
ON documents FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update documents from their organization"
ON documents FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can delete documents from their organization"
ON documents FOR DELETE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Update organization_analytics table RLS policies
DROP POLICY IF EXISTS "Users can view analytics from their organization" ON organization_analytics;
DROP POLICY IF EXISTS "Users can insert analytics for their organization" ON organization_analytics;
DROP POLICY IF EXISTS "Users can update analytics from their organization" ON organization_analytics;

CREATE POLICY "Users can view analytics from their organization"
ON organization_analytics FOR SELECT
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert analytics for their organization"
ON organization_analytics FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update analytics from their organization"
ON organization_analytics FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Update custom_fields table RLS policies
DROP POLICY IF EXISTS "Users can view custom fields from their organization" ON custom_fields;
DROP POLICY IF EXISTS "Users can insert custom fields for their organization" ON custom_fields;
DROP POLICY IF EXISTS "Users can update custom fields from their organization" ON custom_fields;
DROP POLICY IF EXISTS "Users can delete custom fields from their organization" ON custom_fields;

CREATE POLICY "Users can view custom fields from their organization"
ON custom_fields FOR SELECT
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can insert custom fields for their organization"
ON custom_fields FOR INSERT
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can update custom fields from their organization"
ON custom_fields FOR UPDATE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY "Users can delete custom fields from their organization"
ON custom_fields FOR DELETE
USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Note: We can now consider removing the profiles table dependency completely
-- since all organization information is stored in user metadata