// Supabase Realtime Integration for Program Management System
// Add this to your React components for real-time updates

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Types for our data structures
interface DashboardStats {
  todayEnrollments: number
  weekEnrollments: number
  monthEnrollments: number
  activePrograms: number
}

interface Program {
  id: string
  name: string
  description: string
  organization_id: string
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
}

interface Enrollment {
  id: string
  program_id: string
  student_id: string
  organization_id: string
  status: string
  custom_data: Record<string, any>
  created_at: string
}

interface EnrollmentNotification {
  id: string
  programId: string
  studentId: string
  timestamp: Date
}

interface CustomFieldUpdate {
  fieldName: string
  fieldValue: any
  entityId: string
  timestamp: string
}

// Real-time dashboard hook
export function useRealtimeDashboard(organizationId: string) {
  const [stats, setStats] = useState<DashboardStats>({
    todayEnrollments: 0,
    weekEnrollments: 0,
    monthEnrollments: 0,
    activePrograms: 0
  })

  useEffect(() => {
    // Subscribe to analytics table changes
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_analytics',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('New analytics event:', payload)
          // Refresh dashboard stats
          refreshStats()
        }
      )
      .subscribe()

    // Initial load
    refreshStats()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const refreshStats = async () => {
    const { data } = await supabase
      .from('organization_dashboard_stats')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (data) {
      setStats({
        todayEnrollments: data.today_enrollments,
        weekEnrollments: data.week_enrollments,
        monthEnrollments: data.month_enrollments,
        activePrograms: data.active_programs
      })
    }
  }

  return stats
}

// Real-time program updates
export function useRealtimePrograms(organizationId: string) {
  const [programs, setPrograms] = useState<Program[]>([])

  useEffect(() => {
    // Subscribe to program changes
    const channel = supabase
      .channel('program-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'programs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('Program update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setPrograms(prev => [...prev, payload.new as Program])
          } else if (payload.eventType === 'UPDATE') {
            setPrograms(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new as Program : p)
            )
          } else if (payload.eventType === 'DELETE') {
            setPrograms(prev => 
              prev.filter(p => p.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    // Initial load
    loadPrograms()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const loadPrograms = async () => {
    const { data } = await supabase
      .from('programs')
      .select('*')
      .eq('organization_id', organizationId)

    if (data) setPrograms(data)
  }

  return programs
}

// Real-time enrollment notifications
export function useRealtimeEnrollments(organizationId: string) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [newEnrollmentNotification, setNewEnrollmentNotification] = useState<EnrollmentNotification | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('enrollment-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'program_participants',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('New enrollment:', payload)
          
          // Add to enrollments list
          setEnrollments(prev => [payload.new as Enrollment, ...prev])
          
          // Show notification
          setNewEnrollmentNotification({
            id: payload.new.id,
            programId: payload.new.program_id,
            studentId: payload.new.student_id,
            timestamp: new Date()
          })
          
          // Clear notification after 5 seconds
          setTimeout(() => {
            setNewEnrollmentNotification(null)
          }, 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { enrollments, newEnrollmentNotification }
}

// Custom field updates in real-time
export function useRealtimeCustomFields(entityType: string, organizationId: string) {
  const [customFieldUpdates, setCustomFieldUpdates] = useState<CustomFieldUpdate[]>([])

  useEffect(() => {
    const channel = supabase
      .channel('custom-field-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'organization_analytics',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          // Only track custom field events
          if (payload.new.event_type === 'custom_field_set' && 
              payload.new.entity_type === entityType) {
            
            setCustomFieldUpdates(prev => [
              {
                fieldName: payload.new.metric_name,
                fieldValue: payload.new.custom_dimensions[payload.new.metric_name],
                entityId: payload.new.entity_id,
                timestamp: payload.new.time
              },
              ...prev.slice(0, 9) // Keep only last 10 updates
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [entityType, organizationId])

  return customFieldUpdates
}

// Usage in your React components:
/*
function AdminDashboard() {
  const user = useUser()
  const organizationId = user?.user_metadata?.organization_id
  
  // Real-time dashboard stats
  const stats = useRealtimeDashboard(organizationId)
  
  // Real-time programs
  const programs = useRealtimePrograms(organizationId)
  
  // Real-time enrollments with notifications
  const { enrollments, newEnrollmentNotification } = useRealtimeEnrollments(organizationId)
  
  return (
    <div>
      {newEnrollmentNotification && (
        <Toast>
          New enrollment in program {newEnrollmentNotification.programId}!
        </Toast>
      )}
      
      <div className="stats">
        <StatCard title="Today's Enrollments" value={stats.todayEnrollments} />
        <StatCard title="This Week" value={stats.weekEnrollments} />
        <StatCard title="This Month" value={stats.monthEnrollments} />
        <StatCard title="Active Programs" value={stats.activePrograms} />
      </div>
      
      <ProgramsList programs={programs} />
      <RecentEnrollments enrollments={enrollments} />
    </div>
  )
}
*/