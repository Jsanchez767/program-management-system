import { createClient } from '@/lib/supabase/client'

export interface UserMetadata {
  role?: string
  organization_id?: string
  organization_name?: string
  first_name?: string
  last_name?: string
  phone?: string
}

export async function getUserMetadata(): Promise<UserMetadata | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.user_metadata) {
    return null
  }
  
  return user.user_metadata as UserMetadata
}

export async function getUserRole(): Promise<string | null> {
  const metadata = await getUserMetadata()
  return metadata?.role || 'student' // default to student role
}

export async function getUserOrganizationId(): Promise<string | null> {
  const metadata = await getUserMetadata()
  return metadata?.organization_id || null
}

export async function isUserAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

export async function isUserInstructor(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'instructor'
}

export async function canUserManage(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'instructor'
}

// Server-side version for server components
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export function getUserMetadataFromUser(user: any): UserMetadata {
  return user?.user_metadata || {}
}