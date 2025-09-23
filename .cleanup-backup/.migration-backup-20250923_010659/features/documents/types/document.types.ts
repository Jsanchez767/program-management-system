// Document management types
export interface Document {
  id: string
  name: string
  description?: string
  organization_id: string
  program_id?: string
  file_path: string
  file_size: number
  file_type: string
  mime_type: string
  category: 'policy' | 'form' | 'resource' | 'report' | 'certificate' | 'other'
  access_level: 'public' | 'organization' | 'program' | 'restricted'
  tags?: string[]
  uploaded_by: string
  version: number
  parent_document_id?: string
  is_active: boolean
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  uploader?: {
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

export interface DocumentAccess {
  id: string
  document_id: string
  user_id: string
  role: string
  permissions: ('view' | 'download' | 'edit' | 'delete')[]
  granted_at: string
  granted_by: string
}

export interface DocumentFormData {
  name: string
  description?: string
  program_id?: string
  category: Document['category']
  access_level: Document['access_level']
  tags?: string[]
  file: File
  custom_fields?: Record<string, any>
}

export interface DocumentFilters {
  category?: Document['category']
  access_level?: Document['access_level']
  program_id?: string
  tags?: string[]
  file_type?: string
  search?: string
  date_range?: {
    start: string
    end: string
  }
}