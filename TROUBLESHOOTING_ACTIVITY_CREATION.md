# Troubleshooting Activity Creation Issues

## Issue 1: Organization Signup RLS Error
**Error:** "Failed to create organization: new row violates row-level security policy for table 'organizations'"

**Solution:** Run the organization signup policy fix
```bash
npm run sql:show-signup-fix
```
Copy the SQL output and run it in Supabase Dashboard → SQL Editor.

## Issue 2: Foreign Key Constraint Error  
**Error:** "insert or update on table 'activities' violates foreign key constraint 'programs_organization_id_fkey'"

**Solution:** Run the foreign key constraint fix
```bash
npm run sql:show-foreign-key-fix  
```
Copy the SQL output and run it in Supabase Dashboard → SQL Editor.

## Quick Fix for Both Issues

### Step 1: Fix Organization Signup Policy
```bash
npm run sql:show-signup-fix
```

### Step 2: Fix Foreign Key Constraints
```bash
npm run sql:show-foreign-key-fix
```

### Step 3: Test Activity Creation
After running both fixes:
1. Try creating a new admin account
2. Try creating a new activity
3. Both should work without errors

## Alternative: Use VS Code Tasks

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type "Tasks: Run Task"
3. Choose:
   - **Show Organization Signup Fix SQL**
   - **Show Foreign Key Fix SQL**

## What These Fixes Do

### Organization Signup Fix
- Updates RLS policy to allow organization creation during signup
- Allows new admin users to create their organization before having admin role

### Foreign Key Constraint Fix  
- Removes legacy "programs_*" foreign key constraints
- Adds proper "activities_*" foreign key constraints
- Ensures activities table references organizations correctly

## Verification

Run diagnostic queries to verify fixes:
```bash
npm run sql:show-diagnose
```

Look for:
- Organization policies should include "organizations_insert_signup_and_admin"
- Activities table should have "activities_organization_id_fkey" constraint
- No legacy "programs_*" constraints should exist

## Common Issues

### "Function exec_sql does not exist"
This is normal - the scripts show SQL for copy-paste, not direct execution.

### "Still getting foreign key errors"
Make sure to run the foreign key fix after the signup fix, as the organization needs to exist first.

### "Activities table not found"
Run the migration scripts to ensure the activities table was created properly during the programs→activities migration.