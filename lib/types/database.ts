// Auth/User related types
export type UserRole = 'admin' | 'instructor' | 'student'

export interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    role?: UserRole
    organization_id?: string
    organization_name?: string
    phone?: string
  }
}

export interface UserMetadata {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: UserRole
  organization_id?: string
  organization_name?: string
  phone?: string
}

// Organization types
export interface Organization {
  id: string
  name: string
  subdomain: string
  admin_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationInvite {
  id: string
  organization_id: string
  email: string
  role: UserRole
  invited_by: string
  token: string
  accepted_at?: string
  expires_at: string
  created_at: string
  organization?: Organization
}

// Database table interfaces - Updated to match schema with organization support
export interface Program {
  id: string
  name: string
  description: string
  instructor_id: string
  organization_id: string
  start_date: string
  end_date: string
  max_participants?: number
  location?: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ProgramParticipant {
  id: string
  program_id: string
  student_id: string
  organization_id: string
  enrolled_at: string
  status: 'enrolled' | 'completed' | 'dropped'
  completion_date?: string
  final_grade?: string
  notes?: string
  updated_at: string
}

export interface Announcement {
  id: string
  name: string
  content: string
  author_id: string
  organization_id: string
  program_id?: string
  priority: 'low' | 'medium' | 'high'
  target_audience: 'all' | 'instructors' | 'students'
  published: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  title: string
  description?: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_by: string
  student_id?: string
  program_id?: string
  organization_id: string
  category: 'assignment' | 'resource' | 'certificate' | 'report' | 'other'
  is_public: boolean
  requires_review?: boolean
  reviewed?: boolean
  reviewed_by?: string
  reviewed_at?: string
  uploaded_at: string
  updated_at: string
}

export interface LessonPlan {
  id: string
  title: string
  description?: string
  program_id: string
  instructor_id: string
  organization_id: string
  date: string
  duration_minutes?: number
  objectives?: string[]
  materials?: string[]
  activities?: string
  homework?: string
  notes?: string
  status: 'draft' | 'published' | 'completed'
  created_at: string
  updated_at: string
}

export interface PurchaseOrder {
  id: string
  title: string
  description?: string
  program_id: string
  requested_by: string
  organization_id: string
  vendor?: string
  total_amount: number
  currency: string
  items: {
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled'
  approved?: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface FieldTrip {
  id: string
  title: string
  description?: string
  program_id: string
  instructor_id: string
  organization_id: string
  location: string
  date: string
  departure_time?: string
  return_time?: string
  max_participants?: number
  cost_per_participant?: number
  transportation?: string
  requirements?: string[]
  emergency_contacts?: {
    name: string
    phone: string
    relationship: string
  }[]
  status: 'planning' | 'approved' | 'completed' | 'cancelled'
  approved?: boolean
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

// Extended types with user metadata for relations
export interface ProgramWithInstructor extends Program {
  instructor_metadata?: UserMetadata
}

export interface ProgramWithParticipants extends Program {
  participants?: (ProgramParticipant & { student_metadata: UserMetadata })[]
}

export interface AnnouncementWithAuthor extends Announcement {
  author_metadata: UserMetadata
  program?: Program
}

export interface DocumentWithStudent extends Document {
  student_metadata: UserMetadata
  reviewed_by_metadata?: UserMetadata
}

export interface LessonPlanWithProgram extends LessonPlan {
  program: Program
}

export interface PurchaseOrderWithProgram extends PurchaseOrder {
  program: Program
  approved_by_metadata?: UserMetadata
}

export interface FieldTripWithProgram extends FieldTrip {
  program: Program
  approved_by_metadata?: UserMetadata
}

export interface ParticipantWithDetails extends ProgramParticipant {
  student_metadata: UserMetadata
  program: Program
}

// Dashboard stats types
export interface DashboardStats {
  totalPrograms: number
  activePrograms: number
  totalParticipants: number
  totalInstructors: number
  totalStudents: number
  recentAnnouncements: Announcement[]
  upcomingFieldTrips: FieldTrip[]
  pendingDocuments: Document[]
}

// Form types for creating/updating records
export interface CreateProgramData {
  title: string
  description: string
  instructor_id: string
  start_date: string
  end_date: string
  max_participants?: number
  location?: string
}

export interface CreateAnnouncementData {
  title: string
  content: string
  program_id?: string
  priority: 'low' | 'medium' | 'high'
  target_audience: 'all' | 'instructors' | 'students'
  published: boolean
}

export interface CreateDocumentData {
  title: string
  description?: string
  file_path: string
  file_type: string
  file_size: number
  student_id?: string
  program_id?: string
  category: 'assignment' | 'resource' | 'certificate' | 'report' | 'other'
  is_public: boolean
  requires_review?: boolean
}

export interface CreateLessonPlanData {
  title: string
  description?: string
  program_id: string
  date: string
  duration_minutes?: number
  objectives?: string[]
  materials?: string[]
  activities?: string
  homework?: string
  notes?: string
}

export interface CreatePurchaseOrderData {
  title: string
  description?: string
  program_id: string
  vendor?: string
  total_amount: number
  currency: string
  items: {
    description: string
    quantity: number
    unit_price: number
    total: number
  }[]
}

export interface CreateFieldTripData {
  title: string
  description?: string
  program_id: string
  location: string
  date: string
  departure_time?: string
  return_time?: string
  max_participants?: number
  cost_per_participant?: number
  transportation?: string
  requirements?: string[]
  emergency_contacts?: {
    name: string
    phone: string
    relationship: string
  }[]
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}