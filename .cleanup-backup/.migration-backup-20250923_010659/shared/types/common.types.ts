// Shared types used across features
export interface Organization {
  id: string
  name: string
  description?: string
  website?: string
  contact_email?: string
  contact_phone?: string
  address?: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  settings: OrganizationSettings
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  timezone: string
  currency: string
  date_format: string
  time_format: '12h' | '24h'
  language: string
  features: {
    field_trips: boolean
    purchase_orders: boolean
    documents: boolean
    announcements: boolean
    lesson_plans: boolean
  }
  branding?: {
    primary_color: string
    secondary_color: string
    logo_url?: string
  }
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  page_size: number
  total_count: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface PaginationParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface SearchParams {
  query?: string
  filters?: Record<string, any>
}

export interface DateRange {
  start: string
  end: string
}

export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multi_select' | 'textarea'
  required: boolean
  default_value?: any
  options?: string[] // For select/multi_select types
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export interface AuditLog {
  id: string
  entity_type: string
  entity_id: string
  action: 'create' | 'update' | 'delete' | 'view'
  user_id: string
  organization_id: string
  changes?: Record<string, { old: any; new: any }>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  entity_type?: string
  entity_id?: string
  action_url?: string
  created_at: string
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: LoadingState
  error: string | null
}