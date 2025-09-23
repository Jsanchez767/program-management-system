// Participant-specific types
export interface Participant {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  organization_id: string
  status: 'active' | 'inactive' | 'pending'
  date_of_birth?: string
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  medical_info?: {
    allergies?: string[]
    medications?: string[]
    conditions?: string[]
  }
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ParticipantEnrollment {
  id: string
  participant_id: string
  activity_id: string
  organization_id: string
  status: 'enrolled' | 'completed' | 'dropped' | 'waitlist'
  enrollment_date: string
  completion_date?: string
  custom_data: Record<string, any>
  created_at: string
}

export interface ParticipantFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  medical_info?: {
    allergies?: string[]
    medications?: string[]
    conditions?: string[]
  }
  custom_fields?: Record<string, any>
}

export interface ParticipantFilters {
  status?: Participant['status']
  activity_id?: string
  search?: string
}