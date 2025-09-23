# Fix Organization Signup Issue

## Problem
When trying to create a new admin account, you get the error:
```
Failed to create organization: new row violates row-level security policy for table "organizations"
```

## Root Cause
The Row-Level Security (RLS) policies on the `organizations` table are too restrictive. They require users to already have an `admin` role before they can create an organization, but during signup, the user doesn't have any role yet.

## Solution

### Option 1: Use the Database Function (Recommended)
1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `scripts/create-organization-signup-function.sql`
4. Run the script

This creates a secure database function that bypasses RLS restrictions during the signup process.

### Option 2: Update RLS Policy Directly
1. Open your Supabase Dashboard
2. Go to SQL Editor  
3. Copy and paste the contents of `scripts/fix-organization-signup-policy.sql`
4. Run the script

This updates the RLS policy to allow organization creation during signup.

## Testing
After applying either solution:
1. Try creating a new admin account
2. The signup should complete successfully without RLS errors
3. The new admin should be able to access their organization dashboard

## Files Changed
- `scripts/create-organization-signup-function.sql` - Creates secure signup function
- `scripts/fix-organization-signup-policy.sql` - Alternative RLS policy fix
- `scripts/diagnose-signup-issues.sql` - Diagnostic queries
- `app/auth/signup/page.tsx` - Updated to use new database function

## Verification
Run the diagnostic script (`scripts/diagnose-signup-issues.sql`) to verify the fix is working properly.