// Field trip specific types
export interface FieldTrip {
  id: string
  name: string
  description: string
  organization_id: string
  program_id?: string
  instructor_id: string
  location: string
  date: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  cost_per_participant?: number
  transportation?: {
    type: 'bus' | 'walking' | 'other'
    details?: string
  }
  requirements?: string[]
  emergency_contacts: {
    name: string
    phone: string
    role: string
  }[]
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  program?: {
    id: string
    name: string
  }
}

export interface FieldTripParticipant {
  id: string
  field_trip_id: string
  participant_id: string
  status: 'registered' | 'confirmed' | 'attended' | 'no_show'
  registration_date: string
  notes?: string
  participant?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface FieldTripFormData {
  name: string
  description: string
  program_id?: string
  instructor_id: string
  location: string
  date: string
  start_time: string
  end_time: string
  max_participants: number
  cost_per_participant?: number
  transportation?: {
    type: 'bus' | 'walking' | 'other'
    details?: string
  }
  requirements?: string[]
  emergency_contacts: {
    name: string
    phone: string
    role: string
  }[]
  custom_fields?: Record<string, any>
}

export interface FieldTripFilters {
  status?: FieldTrip['status']
  program_id?: string
  instructor_id?: string
  date_range?: {
    start: string
    end: string
  }
}