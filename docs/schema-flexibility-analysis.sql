-- Architecture Analysis: Supporting Tenant Schema Customization
-- When admins/instructors need to create custom fields, tables, and forms

/*
CURRENT LIMITATIONS:
- Shared PostgreSQL schema doesn't allow tenant-specific tables
- RLS policies need manual updates for custom fields
- No self-service schema modifications
- Hard to version control tenant customizations

SOLUTION OPTIONS:
*/

-- =================================================================
-- OPTION 1: JSON/JSONB Fields (Easiest to implement)
-- =================================================================

-- Add flexible data fields to existing tables
ALTER TABLE programs ADD COLUMN custom_fields JSONB DEFAULT '{}';
ALTER TABLE program_participants ADD COLUMN custom_data JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN metadata JSONB DEFAULT '{}';

-- Example usage:
INSERT INTO programs (name, organization_id, custom_fields) VALUES (
  'Advanced Math', 
  'org-123',
  '{
    "difficulty_level": "advanced",
    "prerequisites": ["basic_math", "algebra"],
    "instructor_notes": "Requires whiteboard",
    "custom_pricing": 299.99,
    "tags": ["stem", "math", "advanced"]
  }'
);

-- Query custom fields:
SELECT name, custom_fields->>'difficulty_level' as difficulty
FROM programs 
WHERE organization_id = $1 
  AND custom_fields->>'difficulty_level' = 'advanced';

-- Create indexes on commonly queried custom fields:
CREATE INDEX idx_programs_custom_difficulty 
ON programs USING GIN ((custom_fields->>'difficulty_level'));

-- PROS: ✅ Easy to implement, ✅ No schema changes needed
-- CONS: ❌ Less type safety, ❌ Complex queries for relationships

-- =================================================================
-- OPTION 2: Entity-Attribute-Value (EAV) Pattern
-- =================================================================

-- Create flexible schema for custom fields
CREATE TABLE custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    table_name TEXT NOT NULL, -- 'programs', 'participants', etc.
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL, -- 'text', 'number', 'date', 'boolean', 'select'
    field_options JSONB, -- For select fields, validation rules, etc.
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, table_name, field_name)
);

CREATE TABLE custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    field_definition_id UUID NOT NULL REFERENCES custom_field_definitions(id),
    record_id UUID NOT NULL, -- References the actual record (program_id, participant_id, etc.)
    value_text TEXT,
    value_number NUMERIC,
    value_date DATE,
    value_boolean BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example: Admin creates custom field for programs
INSERT INTO custom_field_definitions (organization_id, table_name, field_name, field_type, field_options) 
VALUES (
    'org-123', 
    'programs', 
    'skill_level', 
    'select', 
    '{"options": ["beginner", "intermediate", "advanced"]}'
);

-- Example: Set custom field value
INSERT INTO custom_field_values (organization_id, field_definition_id, record_id, value_text)
SELECT 
    'org-123',
    cfd.id,
    'program-456',
    'advanced'
FROM custom_field_definitions cfd 
WHERE cfd.organization_id = 'org-123' 
  AND cfd.table_name = 'programs' 
  AND cfd.field_name = 'skill_level';

-- Query with custom fields:
SELECT 
    p.name,
    p.description,
    STRING_AGG(
        CONCAT(cfd.field_name, ': ', COALESCE(cfv.value_text, cfv.value_number::text, cfv.value_date::text, cfv.value_boolean::text)), 
        ', '
    ) as custom_fields
FROM programs p
LEFT JOIN custom_field_values cfv ON cfv.record_id = p.id
LEFT JOIN custom_field_definitions cfd ON cfd.id = cfv.field_definition_id
WHERE p.organization_id = 'org-123'
GROUP BY p.id, p.name, p.description;

-- PROS: ✅ Type safety, ✅ Self-service field creation, ✅ Queryable
-- CONS: ❌ Complex queries, ❌ Performance overhead for joins

-- =================================================================
-- OPTION 3: Database-per-Tenant + Schema Builder (RECOMMENDED)
-- =================================================================

/*
Architecture: Each organization gets their own PostgreSQL schema
Main DB: postgres://main (shared tables: users, organizations, billing)
Tenant DBs: postgres://tenant-{org-id} (custom schemas per organization)

TENANT SCHEMA EXAMPLE:
*/

-- Each tenant gets their own schema with base tables + custom tables
CREATE SCHEMA tenant_org_123;

-- Base tables (standardized)
CREATE TABLE tenant_org_123.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom tables created by admin
CREATE TABLE tenant_org_123.custom_student_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    program_id UUID REFERENCES tenant_org_123.programs(id),
    assessment_type TEXT NOT NULL,
    score NUMERIC,
    notes TEXT,
    assessed_by TEXT,
    assessment_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Another custom table
CREATE TABLE tenant_org_123.equipment_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    quantity INTEGER,
    condition TEXT,
    location TEXT,
    assigned_to_program UUID REFERENCES tenant_org_123.programs(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROS: ✅ Full schema flexibility, ✅ No performance overhead, ✅ Complete isolation
-- CONS: ❌ Complex connection management, ❌ Backup/migration complexity

-- =================================================================
-- OPTION 4: Hybrid NoSQL + PostgreSQL (Modern SaaS approach)
-- =================================================================

/*
Architecture: 
- PostgreSQL for structured data (users, billing, core entities)
- MongoDB/DynamoDB for flexible schemas (custom forms, dynamic data)
- Real-time sync between systems
*/

-- Core PostgreSQL tables (unchanged)
-- + MongoDB collections per organization:

// MongoDB collection: org_123_programs
{
  "_id": "program-456",
  "name": "Advanced Math",
  "description": "Advanced mathematics course",
  "organization_id": "org-123",
  "created_at": "2025-01-01T00:00:00Z",
  
  // Custom fields defined by admin
  "skill_level": "advanced",
  "prerequisites": ["algebra", "geometry"],
  "instructor_requirements": {
    "certifications": ["math_degree", "teaching_license"],
    "experience_years": 5
  },
  "equipment_needed": [
    {"item": "whiteboard", "quantity": 1},
    {"item": "calculators", "quantity": 30}
  ],
  "assessment_rubric": {
    "homework": 30,
    "midterm": 25,
    "final": 25,
    "participation": 20
  }
}

// MongoDB collection: org_123_custom_forms
{
  "_id": "student_intake_form",
  "organization_id": "org-123",
  "form_name": "Student Intake Form",
  "fields": [
    {
      "name": "previous_experience",
      "type": "textarea",
      "required": true,
      "label": "Previous Math Experience"
    },
    {
      "name": "learning_style",
      "type": "select",
      "options": ["visual", "auditory", "kinesthetic"],
      "required": false
    },
    {
      "name": "accommodation_needs",
      "type": "checkbox",
      "options": ["extra_time", "large_print", "quiet_room"]
    }
  ]
}

-- PROS: ✅ Ultimate flexibility, ✅ Self-service everything, ✅ Modern architecture
-- CONS: ❌ Two databases to manage, ❌ Data consistency challenges

-- =================================================================
-- RECOMMENDATION FOR YOUR USE CASE
-- =================================================================

/*
PHASE 1: Start with JSONB fields (Option 1)
- Add custom_fields JSONB to existing tables
- Build form builder UI that saves to JSONB
- Quick to implement, validates the concept

PHASE 2: Move to Database-per-Tenant (Option 3)
- Each organization gets their own PostgreSQL schema
- Full SQL flexibility for custom tables and queries
- Supports complex relationships and reporting

WHY THIS PROGRESSION:
1. ✅ Validate demand with JSONB approach
2. ✅ Learn what customizations tenants actually need
3. ✅ Scale to full schema flexibility when needed
4. ✅ Keep familiar PostgreSQL ecosystem
*/

-- IMPLEMENTATION EXAMPLE:

-- Phase 1: Add JSONB fields to existing tables
ALTER TABLE programs ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE program_participants ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- Create form builder metadata table
CREATE TABLE custom_form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    table_name TEXT NOT NULL,
    form_name TEXT NOT NULL,
    field_definitions JSONB NOT NULL, -- Array of field configs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example form definition:
INSERT INTO custom_form_definitions (organization_id, table_name, form_name, field_definitions)
VALUES (
    'org-123',
    'programs',
    'Program Details Form',
    '[
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
            "max": 50,
            "required": true
        },
        {
            "name": "special_requirements",
            "type": "textarea",
            "label": "Special Requirements",
            "placeholder": "Any special equipment or room requirements...",
            "required": false
        }
    ]'
);

-- This gives you:
-- ✅ Self-service form creation
-- ✅ Dynamic field validation
-- ✅ Structured data storage
-- ✅ Easy migration path to schema-per-tenant later

/*
CONCLUSION:
Your current architecture is PERFECT for starting this journey.
Begin with JSONB custom fields, then evolve to schema-per-tenant
when you have proven demand and understand usage patterns.
*/