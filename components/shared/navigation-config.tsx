import { NavigationItem } from "./unified-sidebar"

export const adminNavigation: NavigationItem[] = [
  { name: "Overview", href: "/admin", icon: "📊" },
  { name: "Programs", href: "/admin/activities", icon: "📚" },
  { name: "Trips", href: "/admin/trips", icon: "🚌" },
  { name: "Participants", href: "/admin/participants", icon: "👥" },
  { name: "Invitations", href: "/admin/invitations", icon: "✉️" },
  { name: "Purchase Orders", href: "/admin/purchase-orders", icon: "🛒" },
  { name: "Documents", href: "/admin/documents", icon: "📄" },
  { name: "Announcements", href: "/admin/announcements", icon: "📢" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
]

export const staffNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/staff", icon: "📊" },
  { name: "My Activities", href: "/staff/programs", icon: "📚" },
  { name: "Lesson Plans", href: "/staff/lesson-plans", icon: "📅" },
  { name: "Purchase Orders", href: "/staff/purchase-orders", icon: "🛒" },
  { name: "Field Trips", href: "/staff/field-trips", icon: "🗺️" },
  { name: "Participants", href: "/staff/participants", icon: "👥" },
  { name: "Documents", href: "/staff/documents", icon: "📄" },
]

export const instructorNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/instructor", icon: "📊" },
  { name: "My Programs", href: "/instructor/programs", icon: "📚" },
  { name: "Lesson Plans", href: "/instructor/lesson-plans", icon: "📅" },
  { name: "Field Trips", href: "/instructor/field-trips", icon: "🗺️" },
  { name: "Purchase Orders", href: "/instructor/purchase-orders", icon: "🛒" },
  { name: "Students", href: "/instructor/students", icon: "👥" },
  { name: "Documents", href: "/instructor/documents", icon: "📄" },
]

export const participantNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/student", icon: "📊" },
  { name: "My Activities", href: "/participant/activities", icon: "📚" },
  { name: "Announcements", href: "/student/announcements", icon: "📢" },
  { name: "Documents", href: "/student/documents", icon: "📄" },
  { name: "Schedule", href: "/student/schedule", icon: "📅" },
  { name: "Profile", href: "/student/profile", icon: "👤" },
]