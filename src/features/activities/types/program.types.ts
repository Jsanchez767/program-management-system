// Program-specific types
export interface Program {
  id: string
  name: string
  description: string
  organization_id: string
  staff_id?: string
  status: 'active' | 'completed' | 'cancelled' | 'draft'
  start_date?: string
  end_date?: string
  max_participants?: number
  current_participants: number
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  staff?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface ProgramFormData {
  name: string
  description: string
  staff_id?: string
  max_participants?: number
  start_date?: string
  end_date?: string
  custom_fields?: Record<string, any>
}

export interface ProgramFilters {
  status?: Program['status']
  staff_id?: string
  search?: string
}

export interface ProgramModalProps {
  activityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onOptimisticUpdate?: (program: Partial<Program>) => void
  organizationId: string
}