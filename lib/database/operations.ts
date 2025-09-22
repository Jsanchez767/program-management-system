import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Program, ProgramParticipant, Announcement, Document, LessonPlan, PurchaseOrder, FieldTrip } from '@/lib/types/database'

// Updated Database type without profiles table
type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          admin_id: string
          created_at: string
          updated_at: string
        }
      }
      programs: {
        Row: Program
        Insert: Omit<Program, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Program, 'id' | 'created_at'>>
      }
      program_participants: {
        Row: ProgramParticipant
        Insert: Omit<ProgramParticipant, 'id' | 'enrolled_at' | 'updated_at'>
        Update: Partial<Omit<ProgramParticipant, 'id' | 'enrolled_at'>>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Announcement, 'id' | 'created_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'uploaded_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'uploaded_at'>>
      }
      lesson_plans: {
        Row: LessonPlan
        Insert: Omit<LessonPlan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LessonPlan, 'id' | 'created_at'>>
      }
      purchase_orders: {
        Row: PurchaseOrder
        Insert: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PurchaseOrder, 'id' | 'created_at'>>
      }
      field_trips: {
        Row: FieldTrip
        Insert: Omit<FieldTrip, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FieldTrip, 'id' | 'created_at'>>
      }
    }
  }
}

function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookies().set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// =============================================================================
// USER METADATA OPERATIONS
// =============================================================================

export interface UserMetadata {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: 'admin' | 'instructor' | 'student'
  organization_id?: string
  organization_name?: string
}

export async function getCurrentUserMetadata(): Promise<UserMetadata | null> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return {
      id: user.id,
      email: user.email || '',
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name,
      role: user.user_metadata?.role,
      organization_id: user.user_metadata?.organization_id,
      organization_name: user.user_metadata?.organization_name
    }
  } catch (error) {
    console.error('Error fetching user metadata:', error)
    return null
  }
}

export async function getInstructorsByOrganization(organizationId: string): Promise<any[]> {
  const supabase = createClient()
  
  try {
    // Use our RPC function to get instructors for the organization
    const { data: instructors, error } = await supabase
      .rpc('get_instructors_for_organization', { 
        org_id: organizationId 
      } as any)

    if (error) {
      console.error('Error fetching instructors:', error)
      return []
    }

    return instructors || []
  } catch (error) {
    console.error('Error fetching instructors by organization:', error)
    return []
  }
}

// =============================================================================
// PROGRAM OPERATIONS
// =============================================================================

export async function getPrograms(): Promise<Program[]> {
  const supabase = createClient()
  
  try {
    const { data: programs } = await supabase
      .from('programs')
      .select(`
        *
      `)
      .order('created_at', { ascending: false })

    return programs || []
  } catch (error) {
    console.error('Error fetching programs:', error)
    return []
  }
}

export async function getProgramById(id: string): Promise<Program | null> {
  const supabase = createClient()
  
  try {
    const { data: program } = await supabase
      .from('programs')
      .select(`
        *
      `)
      .eq('id', id)
      .single()

    return program || null
  } catch (error) {
    console.error('Error fetching program:', error)
    return null
  }
}

// =============================================================================
// PROGRAM PARTICIPANTS OPERATIONS
// =============================================================================

export async function getProgramParticipants(programId: string): Promise<ProgramParticipant[]> {
  const supabase = createClient()
  
  try {
    const { data: participants } = await supabase
      .from('program_participants')
      .select('*')
      .eq('program_id', programId)
      .order('enrolled_at', { ascending: true })

    return participants || []
  } catch (error) {
    console.error('Error fetching program participants:', error)
    return []
  }
}

// =============================================================================
// ANNOUNCEMENTS OPERATIONS
// =============================================================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient()
  
  try {
    const { data: announcements } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    return announcements || []
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return []
  }
}

export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = createClient()
  
  try {
    const { data: announcement } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single()

    return announcement || null
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return null
  }
}

// =============================================================================
// DOCUMENTS OPERATIONS
// =============================================================================

export async function getDocuments(): Promise<Document[]> {
  const supabase = createClient()
  
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .order('uploaded_at', { ascending: false })

    return documents || []
  } catch (error) {
    console.error('Error fetching documents:', error)
    return []
  }
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = createClient()
  
  try {
    const { data: document } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    return document || null
  } catch (error) {
    console.error('Error fetching document:', error)
    return null
  }
}

// =============================================================================
// LESSON PLANS OPERATIONS
// =============================================================================

export async function getLessonPlans(): Promise<LessonPlan[]> {
  const supabase = createClient()
  
  try {
    const { data: lessonPlans } = await supabase
      .from('lesson_plans')
      .select('*')
      .order('date', { ascending: false })

    return lessonPlans || []
  } catch (error) {
    console.error('Error fetching lesson plans:', error)
    return []
  }
}

export async function getLessonPlanById(id: string): Promise<LessonPlan | null> {
  const supabase = createClient()
  
  try {
    const { data: lessonPlan } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('id', id)
      .single()

    return lessonPlan || null
  } catch (error) {
    console.error('Error fetching lesson plan:', error)
    return null
  }
}

// =============================================================================
// PURCHASE ORDERS OPERATIONS
// =============================================================================

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  const supabase = createClient()
  
  try {
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })

    return purchaseOrders || []
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const supabase = createClient()
  
  try {
    const { data: purchaseOrder } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single()

    return purchaseOrder || null
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return null
  }
}

// =============================================================================
// FIELD TRIPS OPERATIONS
// =============================================================================

export async function getFieldTrips(): Promise<FieldTrip[]> {
  const supabase = createClient()
  
  try {
    const { data: fieldTrips } = await supabase
      .from('field_trips')
      .select('*')
      .order('date', { ascending: false })

    return fieldTrips || []
  } catch (error) {
    console.error('Error fetching field trips:', error)
    return []
  }
}

export async function getFieldTripById(id: string): Promise<FieldTrip | null> {
  const supabase = createClient()
  
  try {
    const { data: fieldTrip } = await supabase
      .from('field_trips')
      .select('*')
      .eq('id', id)
      .single()

    return fieldTrip || null
  } catch (error) {
    console.error('Error fetching field trip:', error)
    return null
  }
}

// =============================================================================
// ANALYTICS OPERATIONS
// =============================================================================

export async function getAnalytics() {
  const supabase = createClient()
  
  try {
    // Use RPC function for analytics
    const { data: analytics, error } = await supabase
      .rpc('get_organization_analytics', {
        org_id: ''  // Will be filled by RLS based on user's organization
      } as any)

    if (error) {
      console.error('Error fetching analytics:', error)
      return {
        totalPrograms: 0,
        totalParticipants: 0,
        totalInstructors: 0,
        totalStudents: 0
      }
    }

    return analytics || {
      totalPrograms: 0,
      totalParticipants: 0,
      totalInstructors: 0,
      totalStudents: 0
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return {
      totalPrograms: 0,
      totalParticipants: 0,
      totalInstructors: 0,
      totalStudents: 0
    }
  }
}