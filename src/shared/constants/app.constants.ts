// Application-wide constants
export const APP_CONFIG = {
  name: 'Program Management System',
  version: '1.0.0',
  description: 'Comprehensive program management and collaboration platform'
} as const

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  PARTICIPANT: 'participant'
} as const

export const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
} as const

export const ENROLLMENT_STATUS = {
  ENROLLED: 'enrolled',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  WAITLIST: 'waitlist'
} as const

export const FIELD_TRIP_STATUS = {
  PLANNED: 'planned',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  RECEIVED: 'received',
  CANCELLED: 'cancelled'
} as const

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired'
} as const

export const DOCUMENT_CATEGORIES = {
  POLICY: 'policy',
  FORM: 'form',
  RESOURCE: 'resource',
  REPORT: 'report',
  CERTIFICATE: 'certificate',
  OTHER: 'other'
} as const

export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  ORGANIZATION: 'organization',
  PROGRAM: 'program',
  RESTRICTED: 'restricted'
} as const

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5
} as const

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENTS: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  }
} as const

export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM d, yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'MM/dd/yyyy HH:mm'
} as const

export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 500
} as const

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_ACTIVITIES: '/admin/activities',
  ADMIN_PARTICIPANTS: '/admin/participants',
  ADMIN_FIELD_TRIPS: '/admin/field-trips',
  ADMIN_PURCHASE_ORDERS: '/admin/purchase-orders',
  ADMIN_DOCUMENTS: '/admin/documents',
  ADMIN_INVITATIONS: '/admin/invitations',
  ADMIN_ANNOUNCEMENTS: '/admin/announcements',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Staff routes
  STAFF_DASHBOARD: '/staff',
  STAFF_ACTIVITIES: '/staff/activities',
  STAFF_FIELD_TRIPS: '/staff/field-trips',
  STAFF_LESSON_PLANS: '/staff/lesson-plans',
  STAFF_PURCHASE_ORDERS: '/staff/purchase-orders',
  
  // Participant routes
  PARTICIPANT_DASHBOARD: '/participant',
  PARTICIPANT_ACTIVITIES: '/participant/activities',
  PARTICIPANT_ANNOUNCEMENTS: '/participant/announcements',
  PARTICIPANT_DOCUMENTS: '/participant/documents'
} as const