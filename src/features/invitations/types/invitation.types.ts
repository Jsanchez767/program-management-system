// Invitation specific types
export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: 'admin' | 'staff' | 'participant'
  activity_ids?: string[]
  invited_by: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  accepted_at?: string
  declined_at?: string
  token: string
  custom_message?: string
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  inviter?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  programs?: {
    id: string
    name: string
  }[]
}

export interface InvitationFormData {
  email: string
  role: Invitation['role']
  activity_ids?: string[]
  custom_message?: string
  expires_in_days?: number
  custom_fields?: Record<string, any>
}

export interface BulkInvitationData {
  emails: string[]
  role: Invitation['role']
  activity_ids?: string[]
  custom_message?: string
  expires_in_days?: number
}

export interface InvitationFilters {
  status?: Invitation['status']
  role?: Invitation['role']
  activity_id?: string
  search?: string
  date_range?: {
    start: string
    end: string
  }
}