-- Phase 1: Add JSONB custom fields to existing tables
-- This gives admins/instructors immediate flexibility while you validate demand

-- Add custom fields to core tables
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

ALTER TABLE public.program_participants 
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS custom_properties JSONB DEFAULT '{}';

-- Create form builder configuration table
CREATE TABLE IF NOT EXISTS public.custom_form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL, -- 'programs', 'participants', etc.
    form_name TEXT NOT NULL,
    form_config JSONB NOT NULL, -- Field definitions, validation rules, etc.
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, table_name, form_name)
);

-- Enable RLS for custom forms
ALTER TABLE public.custom_form_definitions ENABLE ROW LEVEL SECURITY;

-- RLS policy for custom forms using user metadata
CREATE POLICY "custom_forms_org_metadata"
  ON public.custom_form_definitions FOR ALL
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Create indexes for fast custom field queries
CREATE INDEX IF NOT EXISTS idx_programs_custom_fields_gin 
ON public.programs USING GIN (custom_fields);

CREATE INDEX IF NOT EXISTS idx_participants_custom_data_gin 
ON public.program_participants USING GIN (custom_data);

-- Example: Admin creates a custom form for programs (commented out for script execution)
-- This would be done through the application, not during migration:
/*
INSERT INTO custom_form_definitions (
    organization_id, 
    table_name, 
    form_name, 
    form_config,
    created_by
) VALUES (
    (auth.jwt() ->> 'organization_id')::uuid,
    'programs',
    'Program Requirements Form',
    '{
        "fields": [
            {
                "name": "difficulty_level",
                "type": "select",
                "label": "Difficulty Level",
                "options": ["beginner", "intermediate", "advanced"],
                "required": true
            },
            {
                "name": "max_students",
                "type": "number",
                "label": "Maximum Students",
                "min": 1,
                "max": 100,
                "required": true
            },
            {
                "name": "prerequisites",
                "type": "multiselect",
                "label": "Prerequisites",
                "options": ["basic_math", "algebra", "geometry", "calculus"],
                "required": false
            },
            {
                "name": "special_equipment",
                "type": "textarea",
                "label": "Special Equipment Needed",
                "placeholder": "List any special equipment or room requirements...",
                "required": false
            },
            {
                "name": "instructor_certifications",
                "type": "checkbox",
                "label": "Required Instructor Certifications",
                "options": ["teaching_license", "subject_certification", "cpr_certified"],
                "required": false
            }
        ],
        "validation": {
            "max_students": {"min": 1, "max": 100}
        }
    }'::jsonb,
    auth.uid()
);
*/

-- Example queries (commented out for script execution - these would be used in application):
/*
-- Example: Query programs with custom fields
SELECT 
    p.name,
    p.description,
    p.custom_fields->>'difficulty_level' as difficulty,
    (p.custom_fields->>'max_students')::integer as max_students,
    p.custom_fields->'prerequisites' as prerequisites
FROM programs p
WHERE p.organization_id = (auth.jwt() ->> 'organization_id')::uuid
  AND p.custom_fields->>'difficulty_level' = 'advanced';

-- Example: Create program with custom data
INSERT INTO programs (
    name, 
    description, 
    organization_id, 
    custom_fields
) VALUES (
    'Advanced Calculus',
    'College-level calculus course',
    (auth.jwt() ->> 'organization_id')::uuid,
    '{
        "difficulty_level": "advanced",
        "max_students": 25,
        "prerequisites": ["algebra", "geometry", "pre_calculus"],
        "special_equipment": "Graphing calculators required for each student",
        "instructor_certifications": ["teaching_license", "math_certification"]
    }'::jsonb
);
*/

-- Functions for dynamic form handling
CREATE OR REPLACE FUNCTION validate_custom_fields(
    p_table_name TEXT,
    p_organization_id UUID,
    p_custom_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    form_config JSONB;
    field_config JSONB;
    field_name TEXT;
    field_value TEXT;
BEGIN
    -- Get the form configuration
    SELECT cfd.form_config INTO form_config
    FROM custom_form_definitions cfd
    WHERE cfd.organization_id = p_organization_id
      AND cfd.table_name = p_table_name
      AND cfd.is_active = true
    LIMIT 1;
    
    IF form_config IS NULL THEN
        RETURN true; -- No validation rules, allow anything
    END IF;
    
    -- Validate each field (simplified example)
    FOR field_config IN SELECT * FROM jsonb_array_elements(form_config->'fields')
    LOOP
        field_name := field_config->>'name';
        
        -- Check required fields
        IF (field_config->>'required')::boolean = true THEN
            IF p_custom_data->>field_name IS NULL OR p_custom_data->>field_name = '' THEN
                RAISE EXCEPTION 'Required field % is missing', field_name;
            END IF;
        END IF;
        
        -- Add more validation logic as needed (type checking, range validation, etc.)
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example: Reporting with custom fields (commented out for script execution):
/*
-- Admin can build custom reports using their custom fields
WITH program_stats AS (
    SELECT 
        p.custom_fields->>'difficulty_level' as difficulty,
        COUNT(*) as program_count,
        AVG((p.custom_fields->>'max_students')::integer) as avg_max_students,
        COUNT(pp.id) as total_enrollments
    FROM programs p
    LEFT JOIN program_participants pp ON pp.program_id = p.id
    WHERE p.organization_id = (auth.jwt() ->> 'organization_id')::uuid
      AND p.custom_fields ? 'difficulty_level'
    GROUP BY p.custom_fields->>'difficulty_level'
)
SELECT * FROM program_stats ORDER BY difficulty;
*/

-- This approach gives you:
-- ✅ Immediate self-service custom fields
-- ✅ No schema migrations needed
-- ✅ Rich querying capabilities with GIN indexes
-- ✅ Form builder UI can read/write form_config
-- ✅ Validation rules stored in database
-- ✅ Easy migration path to schema-per-tenant later