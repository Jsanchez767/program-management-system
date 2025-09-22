import { createClient } from '@/lib/supabase/client'
import type {
  Profile,
  Program,
  ProgramParticipant,
  Announcement,
  Document,
  LessonPlan,
  PurchaseOrder,
  FieldTrip,
  ProgramWithInstructor,
  AnnouncementWithAuthor,
  CreateProgramForm,
  CreateAnnouncementForm,
  CreateLessonPlanForm,
  CreatePurchaseOrderForm,
  CreateFieldTripForm
} from '@/lib/types/database'

const supabase = createClient()

// Profile operations
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(id: string, updates: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Program operations
export async function getPrograms(): Promise<ProgramWithInstructor[]> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      instructor:profiles!programs_instructor_id_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProgram(id: string): Promise<ProgramWithInstructor | null> {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      instructor:profiles!programs_instructor_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createProgram(program: CreateProgramForm): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .insert(program)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProgram(id: string, updates: Partial<Program>): Promise<Program> {
  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Announcement operations
export async function getAnnouncements(): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      author:profiles!announcements_author_id_fkey(*),
      program:programs(*)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createAnnouncement(announcement: CreateAnnouncementForm): Promise<Announcement> {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      ...announcement,
      author_id: profile.id,
      published_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Lesson Plan operations
export async function getLessonPlans(programId?: string): Promise<LessonPlan[]> {
  let query = supabase
    .from('lesson_plans')
    .select(`
      *,
      program:programs(*)
    `)
    .order('lesson_date', { ascending: true })

  if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createLessonPlan(lessonPlan: CreateLessonPlanForm): Promise<LessonPlan> {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('lesson_plans')
    .insert({
      ...lessonPlan,
      instructor_id: profile.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateLessonPlan(id: string, updates: Partial<LessonPlan>): Promise<LessonPlan> {
  const { data, error } = await supabase
    .from('lesson_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Purchase Order operations
export async function getPurchaseOrders(programId?: string): Promise<PurchaseOrder[]> {
  let query = supabase
    .from('purchase_orders')
    .select(`
      *,
      program:programs(*),
      approved_by_profile:profiles!purchase_orders_approved_by_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createPurchaseOrder(purchaseOrder: CreatePurchaseOrderForm): Promise<PurchaseOrder> {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('purchase_orders')
    .insert({
      ...purchaseOrder,
      instructor_id: profile.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Field Trip operations
export async function getFieldTrips(programId?: string): Promise<FieldTrip[]> {
  let query = supabase
    .from('field_trips')
    .select(`
      *,
      program:programs(*),
      approved_by_profile:profiles!field_trips_approved_by_fkey(*)
    `)
    .order('trip_date', { ascending: true })

  if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createFieldTrip(fieldTrip: CreateFieldTripForm): Promise<FieldTrip> {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('field_trips')
    .insert({
      ...fieldTrip,
      instructor_id: profile.id
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFieldTrip(id: string, updates: Partial<FieldTrip>): Promise<FieldTrip> {
  const { data, error } = await supabase
    .from('field_trips')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Document operations
export async function getDocuments(studentId?: string): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select(`
      *,
      student:profiles!documents_student_id_fkey(*),
      reviewed_by_profile:profiles!documents_reviewed_by_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// Dashboard stats
export async function getDashboardStats() {
  const [
    { count: totalPrograms },
    { count: activePrograms },
    { count: totalStudents },
    { count: totalInstructors },
    { count: pendingDocuments },
    { count: pendingPurchaseOrders },
    { count: upcomingFieldTrips },
    { count: recentAnnouncements }
  ] = await Promise.all([
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'instructor'),
    supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('field_trips').select('*', { count: 'exact', head: true }).gte('trip_date', new Date().toISOString().split('T')[0]),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('is_published', true).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  ])

  return {
    totalPrograms: totalPrograms || 0,
    activePrograms: activePrograms || 0,
    totalStudents: totalStudents || 0,
    totalInstructors: totalInstructors || 0,
    pendingDocuments: pendingDocuments || 0,
    pendingPurchaseOrders: pendingPurchaseOrders || 0,
    upcomingFieldTrips: upcomingFieldTrips || 0,
    recentAnnouncements: recentAnnouncements || 0
  }
}