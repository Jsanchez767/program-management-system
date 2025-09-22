# Database Scripts

This directory contains SQL scripts to set up the database schema and security policies for the Program Management System.

## Execution Order

Run these scripts in the following order in your Supabase SQL editor:

### 1. Core Table Creation
```sql
-- 001_create_users_and_profiles.sql - User profiles and base setup
-- 002_create_programs.sql - Programs table
-- 003_create_participants.sql - Program participants
-- 004_create_announcements.sql - Announcements system
-- 005_create_documents.sql - Document management
-- 006_create_lesson_plans.sql - Lesson planning
-- 007_create_purchase_orders.sql - Purchase order tracking
-- 008_create_field_trips.sql - Field trip management
```

### 2. Multi-Tenancy Setup
```sql
-- 009_create_organizations.sql - Organizations and multi-tenancy setup
-- 010_multi_tenant_policies.sql - Comprehensive RLS policies for data isolation
```

### 3. Storage Setup
```sql
-- create-storage-bucket.sql - File storage configuration
```

## Multi-Tenant Architecture

The system implements multi-tenancy through:

- **Organizations**: Each admin creates their own organization
- **Row Level Security (RLS)**: Data isolation between organizations
- **Relationship-based Policies**: Access control through table relationships
- **Role-based Permissions**: Admin, Instructor, and Student roles

## Key Features

- **Complete Data Isolation**: Each organization sees only their data
- **Invitation System**: Admins can invite users to their workspace
- **Role-based Access**: Different permissions for different user types
- **Secure Policies**: Comprehensive RLS policies prevent data leakage

## Notes

- Always run scripts in the specified order
- Verify each script executes successfully before proceeding
- The policies in `010_multi_tenant_policies.sql` replace all previous policy configurations
- Storage policies are included in the main policy script