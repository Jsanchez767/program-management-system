# Migration Guide: Programs → Activities, Role Updates

This guide covers the comprehensive migration from "Programs" to "Activities" and role updates (staff → staff, student → participant).

## 🎯 Migration Overview

### Changes Being Made:
1. **Database Tables:**
   - `programs` → `activities`
   - `program_participants` → `participants`

2. **Column Names:**
   - `activity_id` → `activity_id`
   - `staff_id` → `staff_id`
   - `participant_id` → `participant_id`

3. **User Roles:**
   - `staff` → `staff`
   - `participant` → `participant`
   - `admin` stays the same

4. **Code Structure:**
   - All references updated throughout codebase
   - Folder names updated
   - Component names updated
   - Routes updated

## 🚀 Migration Steps

### Step 1: Backup Current State
```bash
# Create backup of current database
pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Code backup is automatically created by the migration script
```

### Step 2: Run Database Migration
```bash
# Execute the database migration script in your Supabase SQL editor
# or via psql:
psql -d your_database -f scripts/rename-programs-to-activities.sql
```

### Step 3: Run Code Migration
```bash
# Execute the code migration script
./scripts/migrate-code-programs-to-activities.sh
```

### Step 4: Test the Application
```bash
# Install dependencies and test
npm install
npm run build
npm run dev
```

## 📋 What Each Script Does

### Database Migration (`rename-programs-to-activities.sql`)

#### User Role Updates:
- Updates `auth.users.raw_user_meta_data` to change roles
- `staff` → `staff`
- `participant` → `participant`

#### Table Renames:
- `programs` → `activities`
- `program_participants` → `participants`

#### Column Updates:
- `activity_id` → `activity_id` (all tables)
- `staff_id` → `staff_id` (activities, field_trips)
- `participant_id` → `participant_id` (participants, documents)

#### Security Updates:
- Recreates all RLS policies with new role names
- Updates RPC functions
- Updates helper functions (`is_staff()`, `is_participant()`)
- Updates triggers and constraints

#### New RPC Functions:
- `insert_activity_admin()` (replaces `insert_activity_admin()`)
- `get_staff_for_organization()` (replaces `get_staffs_for_organization()`)

### Code Migration (`migrate-code-programs-to-activities.sh`)

#### File and Folder Renames:
- `app/staff/` → `app/staff/`
- `app/student/` → `app/participant/`
- `app/admin/programs/` → `app/admin/activities/`
- `src/features/programs/` → `src/features/activities/`
- `src/features/staff/` → `src/features/staff/`
- `src/features/student/` → `src/features/participant/`

#### Code Updates:
- All database queries updated
- TypeScript interfaces updated
- Component names updated
- Import paths updated
- Constants and enums updated
- Comments and documentation updated

## 🔍 Verification Checklist

After migration, verify these areas:

### Database Verification:
```sql
-- Check user roles updated
SELECT raw_user_meta_data->>'role' as role, count(*) 
FROM auth.users 
WHERE raw_user_meta_data->>'role' IS NOT NULL 
GROUP BY raw_user_meta_data->>'role';

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('activities', 'participants');

-- Check RPC functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('insert_activity_admin', 'get_staff_for_organization');
```

### Application Verification:
1. **Authentication flows work**
2. **Admin dashboard loads**
3. **Staff portal accessible**
4. **Participant portal accessible**
5. **Activity creation works**
6. **Participant enrollment works**
7. **All CRUD operations function**

### Route Verification:
- `/admin` - Admin dashboard
- `/staff` - Staff portal (was `/staff`)
- `/participant` - Participant portal (was `/student`)
- `/admin/activities` - Activity management (was `/admin/programs`)

## 🛠️ Troubleshooting

### Common Issues:

#### 1. Import Path Errors
```bash
# If you see import errors, check for missed path updates:
grep -r "from.*staff" src/
grep -r "from.*student" src/
grep -r "from.*programs" src/
```

#### 2. Database Connection Errors
```sql
-- Verify RLS policies are working:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('activities', 'participants');
```

#### 3. Role Permission Issues
```sql
-- Check user roles in database:
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE raw_user_meta_data->>'role' IS NOT NULL;
```

#### 4. TypeScript Compilation Errors
```bash
# Check for type definition issues:
npm run type-check
```

## 🔄 Rollback Plan

If you need to rollback:

### Database Rollback:
```sql
-- Restore from backup
psql -d your_database < backup_YYYYMMDD_HHMMSS.sql
```

### Code Rollback:
```bash
# Use the automatic backup created by the migration script
rm -rf app/ src/ lib/ components/
mv .migration-backup-YYYYMMDD_HHMMSS/* ./
```

## 📊 Migration Impact

### Database Changes:
- ✅ Zero data loss (only renames and role updates)
- ✅ All relationships preserved
- ✅ RLS policies updated and functional
- ✅ Indexes and constraints recreated

### Code Changes:
- ✅ All imports updated
- ✅ Component structure preserved
- ✅ Functionality maintained
- ✅ Type safety preserved

### User Impact:
- ✅ URLs automatically redirect
- ✅ Authentication flows unchanged
- ✅ Data access permissions updated
- ✅ UI terminology updated

## 🎉 Post-Migration

After successful migration:

1. **Update documentation** with new terminology
2. **Update any external integrations** that reference old endpoints
3. **Inform users** about new role names and URLs
4. **Monitor application** for any issues
5. **Update deployment scripts** if needed

## 📞 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Verify all verification steps
3. Review the backup files created
4. Ensure all dependencies are installed
5. Check browser console for client-side errors

The migration scripts are designed to be comprehensive and safe, with automatic backups and verification steps.