-- 016_add_organization_id_to_remaining_tables.sql
-- Add organization_id column to tables that don't have it yet
-- This prepares these tables for proper multi-tenant RLS policies

BEGIN;

-- Add organization_id to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_announcements_organization_id 
ON public.announcements(organization_id);

-- Backfill organization_id for existing announcements
-- (if any exist, this will need to be customized based on existing data)
UPDATE public.announcements 
SET organization_id = (
  SELECT p.organization_id 
  FROM activities p 
  WHERE p.id = announcements.activity_id
)
WHERE organization_id IS NULL AND activity_id IS NOT NULL;

-- Add organization_id to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_documents_organization_id 
ON public.documents(organization_id);

-- Backfill organization_id for existing documents
-- (this will need to be customized based on how documents relate to organizations)
-- For now, we'll leave them NULL and they can be updated manually

-- Add organization_id to lesson_plans table
ALTER TABLE public.lesson_plans 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lesson_plans_organization_id 
ON public.lesson_plans(organization_id);

-- Backfill organization_id for existing lesson plans
UPDATE public.lesson_plans 
SET organization_id = (
  SELECT p.organization_id 
  FROM activities p 
  WHERE p.id = lesson_plans.activity_id
)
WHERE organization_id IS NULL AND activity_id IS NOT NULL;

-- Add organization_id to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_organization_id 
ON public.purchase_orders(organization_id);

-- Backfill organization_id for existing purchase orders
UPDATE public.purchase_orders 
SET organization_id = (
  SELECT p.organization_id 
  FROM activities p 
  WHERE p.id = purchase_orders.activity_id
)
WHERE organization_id IS NULL AND activity_id IS NOT NULL;

-- Add organization_id to field_trips table
ALTER TABLE public.field_trips 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_field_trips_organization_id 
ON public.field_trips(organization_id);

-- Backfill organization_id for existing field trips
UPDATE public.field_trips 
SET organization_id = (
  SELECT p.organization_id 
  FROM activities p 
  WHERE p.id = field_trips.activity_id
)
WHERE organization_id IS NULL AND activity_id IS NOT NULL;

-- Add triggers to automatically set organization_id when records are inserted
-- This ensures data consistency going forward

-- Trigger for announcements
CREATE OR REPLACE FUNCTION set_announcement_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.activity_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM activities 
    WHERE id = NEW.activity_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_announcement_organization_id ON public.announcements;
CREATE TRIGGER trigger_set_announcement_organization_id
  BEFORE INSERT OR UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION set_announcement_organization_id();

-- Trigger for lesson plans
CREATE OR REPLACE FUNCTION set_lesson_plan_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.activity_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM activities 
    WHERE id = NEW.activity_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_lesson_plan_organization_id ON public.lesson_plans;
CREATE TRIGGER trigger_set_lesson_plan_organization_id
  BEFORE INSERT OR UPDATE ON public.lesson_plans
  FOR EACH ROW EXECUTE FUNCTION set_lesson_plan_organization_id();

-- Trigger for purchase orders
CREATE OR REPLACE FUNCTION set_purchase_order_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.activity_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM activities 
    WHERE id = NEW.activity_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_purchase_order_organization_id ON public.purchase_orders;
CREATE TRIGGER trigger_set_purchase_order_organization_id
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION set_purchase_order_organization_id();

-- Trigger for field trips
CREATE OR REPLACE FUNCTION set_field_trip_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.activity_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM activities 
    WHERE id = NEW.activity_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_field_trip_organization_id ON public.field_trips;
CREATE TRIGGER trigger_set_field_trip_organization_id
  BEFORE INSERT OR UPDATE ON public.field_trips
  FOR EACH ROW EXECUTE FUNCTION set_field_trip_organization_id();

COMMIT;

-- Now these tables are ready for RLS policies using organization_id
-- You can run the full RLS policies script after this