-- Run SQL directly in Supabase SQL Editor
-- Copy and paste this into your Supabase Dashboard → SQL Editor

-- 016_add_organization_id_to_remaining_tables.sql
-- Add organization_id column to tables that don't have it yet
-- This prepares these tables for proper multi-tenant RLS policies

BEGIN;