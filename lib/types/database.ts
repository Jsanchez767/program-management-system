// Database types based on Supabase schema - Updated to match actual database
export type UserRole = 'admin' | 'instructor' | 'student'

export type ProgramStatus = 'active' | 'inactive' | 'completed' | 'cancelled'

export type ParticipantStatus = 'enrolled' | 'completed' | 'dropped' | 'pending'

export type AnnouncementTargetAudience = 'all' | 'students' | 'instructors' | 'program_specific'

export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent'

export type DocumentType = 'enrollment' | 'medical' | 'emergency_contact' | 'photo_release' | 'other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'missing'

export type LessonPlanStatus = 'draft' | 'published' | 'completed'

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received'

export type FieldTripStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'scheduled' | 'completed' | 'cancelled'

// Database table interfaces - Updated to match schema
export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role: UserRole
  phone?: string
  created_at: string
  updated_at: string
}

export interface Program {
  id: string
  name: string
  description?: string
  category?: string
  start_date?: string
  end_date?: string
  max_participants?: number
  current_participants: number
  instructor_id?: string
  status: ProgramStatus
  created_at: string
  updated_at: string
}

export interface ProgramParticipant {
  id: string
  program_id: string
  student_id: string
  enrollment_date: string
  status: ParticipantStatus
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  target_audience: AnnouncementTargetAudience
  program_id?: string
  priority: AnnouncementPriority
  is_published: boolean
  published_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  name: string
  description?: string
  file_url?: string
  file_type?: string
  file_size?: number
  student_id: string
  program_id?: string
  document_type: DocumentType
  status: DocumentStatus
  reviewed_by?: string
  reviewed_at?: string
  notes?: string
  is_required: boolean
  created_at: string
  updated_at: string
}

export interface LessonPlan {
  id: string
  program_id: string
  instructor_id: string
  title: string
  description?: string
  lesson_date: string
  duration_minutes?: number
  objectives?: string[]
  materials_needed?: string[]
  activities?: string
  notes?: string
  status: LessonPlanStatus
  created_at: string
  updated_at: string
}

export interface PurchaseOrderItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
  description?: string
}

export interface PurchaseOrder {
  id: string
  program_id: string
  instructor_id: string
  title: string
  description?: string
  vendor?: string
  total_amount?: number
  currency: string
  items?: PurchaseOrderItem[]
  justification?: string
  status: PurchaseOrderStatus
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface FieldTrip {
  id: string
  program_id: string
  instructor_id: string
  title: string
  description?: string
  destination: string
  trip_date: string
  departure_time?: string
  return_time?: string
  transportation?: string
  cost_per_student?: number
  max_participants?: number
  educational_objectives?: string
  safety_considerations?: string
  required_permissions?: string[]
  status: FieldTripStatus
  submitted_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

// Extended types with relations for joins
export interface ProgramWithInstructor extends Program {
  instructor?: Profile
}

export interface ProgramWithParticipants extends Program {
  participants?: (ProgramParticipant & { student: Profile })[]
}

export interface AnnouncementWithAuthor extends Announcement {
  author: Profile
  program?: Program
}

export interface DocumentWithStudent extends Document {
  student: Profile
  reviewed_by_profile?: Profile
}

export interface LessonPlanWithProgram extends LessonPlan {
  program: Program
}

export interface PurchaseOrderWithProgram extends PurchaseOrder {
  program: Program
  approved_by_profile?: Profile
}

export interface FieldTripWithProgram extends FieldTrip {
  program: Program
  approved_by_profile?: Profile
}

export interface ParticipantWithDetails extends ProgramParticipant {
  student: Profile
  program: Program
}

// Dashboard stats types
export interface DashboardStats {
  totalPrograms: number
  activePrograms: number
  totalStudents: number
  totalInstructors: number
  pendingDocuments: number
  pendingPurchaseOrders: number
  upcomingFieldTrips: number
  recentAnnouncements: number
}

// Form types for creating/updating records
export interface CreateProgramForm {
  name: string
  description?: string
  category?: string
  start_date?: string
  end_date?: string
  max_participants?: number
  instructor_id?: string
}

export interface CreateAnnouncementForm {
  title: string
  content: string
  target_audience: AnnouncementTargetAudience
  program_id?: string
  priority: AnnouncementPriority
  expires_at?: string
}

export interface CreateLessonPlanForm {
  program_id: string
  title: string
  description?: string
  lesson_date: string
  duration_minutes?: number
  objectives?: string[]
  materials_needed?: string[]
  activities?: string
  notes?: string
}

export interface CreatePurchaseOrderForm {
  program_id: string
  title: string
  description?: string
  vendor?: string
  items?: PurchaseOrderItem[]
  justification?: string
}

export interface CreateFieldTripForm {
  program_id: string
  title: string
  description?: string
  destination: string
  trip_date: string
  departure_time?: string
  return_time?: string
  transportation?: string
  cost_per_student?: number
  max_participants?: number
  educational_objectives?: string
  safety_considerations?: string
  required_permissions?: string[]
}

export interface CreateDocumentForm {
  name: string
  description?: string
  file_url?: string
  file_type?: string
  file_size?: number
  program_id?: string
  document_type: DocumentType
  is_required?: boolean
}