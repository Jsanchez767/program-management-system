-- Script to apply user metadata changes across multiple admin pages
-- This documents the pattern for updating from profiles table to user metadata

/*
PATTERN TO REPLACE:

OLD:
// Get user's profile to get organization_id
const { data: profile } = await supabase
  .from('profiles')
  .select('organization_id')
  .eq('id', user.id)
  .single()

if (!profile?.organization_id) return

// ... use profile.organization_id

NEW:
// Get current user and their organization from user metadata
if (!user?.user_metadata?.organization_id) return

const organizationId = user.user_metadata.organization_id

// ... use organizationId

This eliminates:
1. Extra database query to profiles table
2. Circular dependency issues with RLS policies
3. Need to keep profile table in sync

Files to update:
- app/admin/purchase-orders/page.tsx
- app/admin/field-trips/page.tsx
- app/dashboard/page.tsx
- app/admin/programs/new/page.tsx
- app/admin/invitations/page.tsx
- app/auth/invitation/page.tsx

Each follows the same pattern of querying profiles table for organization_id
*/