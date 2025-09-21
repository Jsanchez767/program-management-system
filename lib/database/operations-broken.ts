import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Program, ProgramParticipant, Announcement, Document, LessonPlan, PurchaseOrder, FieldTrip } from '@/lib/types/database'

// Updated Database type without profiles table
type Database = {
  public: {
    Tables: {
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

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// =============================================================================
// DASHBOARD OPERATIONS
// =============================================================================

export async function getDashboardStats() {
  const supabase = createClient()
  
  try {
    // Get total programs
    const { count: totalPrograms } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })

    // Get total participants
    const { count: totalParticipants } = await supabase
      .from('program_participants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get active announcements
    const { count: activeAnnouncements } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .gte('expires_at', new Date().toISOString())

    // Get pending documents
    const { count: pendingDocuments } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return {
      totalPrograms: totalPrograms || 0,
      totalParticipants: totalParticipants || 0,
      activeAnnouncements: activeAnnouncements || 0,
      pendingDocuments: pendingDocuments || 0,
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return {
      totalPrograms: 0,
      totalParticipants: 0,
      activeAnnouncements: 0,
      pendingDocuments: 0,
    }
  }
}

// =============================================================================
// USER METADATA OPERATIONS (replaces profile operations)
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
      .rpc('get_instructors_for_organization', { org_id: organizationId })

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

export async function getAllPrograms(): Promise<Program[]> {
  const supabase = createClient()
  
  try {
    const { data: programs } = await supabase
      .from('programs')
      .select(`
        *,
        instructor:profiles!programs_instructor_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
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
        *,
        instructor:profiles!programs_instructor_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    return program || null
  } catch (error) {
    console.error('Error fetching program:', error)
    return null
  }
}

export async function getProgramParticipants(programId: string): Promise<ProgramParticipant[]> {
  const supabase = createClient()
  
  try {
    const { data: participants } = await supabase
      .from('program_participants')
      .select(`
        *,
        student:profiles!program_participants_student_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        program:programs!program_participants_program_id_fkey(
          id,
          name,
          description
        )
      `)
      .eq('program_id', programId)
      .order('enrolled_at', { ascending: false })

    return participants || []
  } catch (error) {
    console.error('Error fetching program participants:', error)
    return []
  }
}

// =============================================================================
// ANNOUNCEMENT OPERATIONS
// =============================================================================

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient()
  
  try {
    const { data: announcements } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!announcements_program_id_fkey(
          id,
          name
        )
      `)
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })

    return announcements || []
  } catch (error) {
    console.error('Error fetching active announcements:', error)
    return []
  }
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient()
  
  try {
    const { data: announcements } = await supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_author_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!announcements_program_id_fkey(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    return announcements || []
  } catch (error) {
    console.error('Error fetching all announcements:', error)
    return []
  }
}

// =============================================================================
// DOCUMENT OPERATIONS
// =============================================================================

export async function getDocumentsByStudent(studentId: string): Promise<Document[]> {
  const supabase = createClient()
  
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        *,
        student:profiles!documents_student_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!documents_program_id_fkey(
          id,
          name
        )
      `)
      .eq('student_id', studentId)
      .order('uploaded_at', { ascending: false })

    return documents || []
  } catch (error) {
    console.error('Error fetching documents by student:', error)
    return []
  }
}

export async function getAllDocuments(): Promise<Document[]> {
  const supabase = createClient()
  
  try {
    const { data: documents } = await supabase
      .from('documents')
      .select(`
        *,
        student:profiles!documents_student_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!documents_program_id_fkey(
          id,
          name
        )
      `)
      .order('uploaded_at', { ascending: false })

    return documents || []
  } catch (error) {
    console.error('Error fetching all documents:', error)
    return []
  }
}

// =============================================================================
// LESSON PLAN OPERATIONS
// =============================================================================

export async function getLessonPlansByInstructor(instructorId: string): Promise<LessonPlan[]> {
  const supabase = createClient()
  
  try {
    const { data: lessonPlans } = await supabase
      .from('lesson_plans')
      .select(`
        *,
        instructor:profiles!lesson_plans_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!lesson_plans_program_id_fkey(
          id,
          name
        )
      `)
      .eq('instructor_id', instructorId)
      .order('lesson_date', { ascending: false })

    return lessonPlans || []
  } catch (error) {
    console.error('Error fetching lesson plans by instructor:', error)
    return []
  }
}

export async function getAllLessonPlans(): Promise<LessonPlan[]> {
  const supabase = createClient()
  
  try {
    const { data: lessonPlans } = await supabase
      .from('lesson_plans')
      .select(`
        *,
        instructor:profiles!lesson_plans_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!lesson_plans_program_id_fkey(
          id,
          name
        )
      `)
      .order('lesson_date', { ascending: false })

    return lessonPlans || []
  } catch (error) {
    console.error('Error fetching all lesson plans:', error)
    return []
  }
}

// =============================================================================
// PURCHASE ORDER OPERATIONS
// =============================================================================

export async function getPurchaseOrdersByInstructor(instructorId: string): Promise<PurchaseOrder[]> {
  const supabase = createClient()
  
  try {
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        instructor:profiles!purchase_orders_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!purchase_orders_program_id_fkey(
          id,
          name
        )
      `)
      .eq('instructor_id', instructorId)
      .order('requested_date', { ascending: false })

    return purchaseOrders || []
  } catch (error) {
    console.error('Error fetching purchase orders by instructor:', error)
    return []
  }
}

export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  const supabase = createClient()
  
  try {
    const { data: purchaseOrders } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        instructor:profiles!purchase_orders_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!purchase_orders_program_id_fkey(
          id,
          name
        )
      `)
      .order('requested_date', { ascending: false })

    return purchaseOrders || []
  } catch (error) {
    console.error('Error fetching all purchase orders:', error)
    return []
  }
}

// =============================================================================
// FIELD TRIP OPERATIONS
// =============================================================================

export async function getFieldTripsByInstructor(instructorId: string): Promise<FieldTrip[]> {
  const supabase = createClient()
  
  try {
    const { data: fieldTrips } = await supabase
      .from('field_trips')
      .select(`
        *,
        instructor:profiles!field_trips_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!field_trips_program_id_fkey(
          id,
          name
        )
      `)
      .eq('instructor_id', instructorId)
      .order('trip_date', { ascending: false })

    return fieldTrips || []
  } catch (error) {
    console.error('Error fetching field trips by instructor:', error)
    return []
  }
}

export async function getAllFieldTrips(): Promise<FieldTrip[]> {
  const supabase = createClient()
  
  try {
    const { data: fieldTrips } = await supabase
      .from('field_trips')
      .select(`
        *,
        instructor:profiles!field_trips_instructor_id_fkey(
          id,
          first_name,
          last_name
        ),
        program:programs!field_trips_program_id_fkey(
          id,
          name
        )
      `)
      .order('trip_date', { ascending: false })

    return fieldTrips || []
  } catch (error) {
    console.error('Error fetching all field trips:', error)
    return []
  }
}