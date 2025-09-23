// Authentication and user types
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'staff' | 'participant'
  organization_id: string
  profile_picture?: string
  phone?: string
  bio?: string
  preferences: UserPreferences
  last_login?: string
  is_active: boolean
  email_verified: boolean
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    announcements: boolean
    reminders: boolean
  }
  dashboard_layout?: string[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  first_name: string
  last_name: string
  organization_name?: string
  invitation_token?: string
}

export interface ResetPasswordData {
  email: string
}

export interface UpdatePasswordData {
  current_password: string
  new_password: string
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  bio?: string
  preferences?: Partial<UserPreferences>
  custom_fields?: Record<string, any>
}

export interface AuthError {
  message: string
  field?: string
  code?: string
}