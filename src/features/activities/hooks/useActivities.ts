import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Program } from '../types/activity.types'

const supabase = createClient()

export function usePrograms(organizationId: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const loadActivities = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('activities')
          .select(`
            *,
            staff:staff_id (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('organization_id', organizationId)

        if (fetchError) throw fetchError

        if (isMounted) {
          setActivities(data || [])
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load programs')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Real-time subscription
    const channel = supabase
      .channel('programs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'programs',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (!isMounted) return

          if (payload.eventType === 'INSERT') {
            setActivities(prev => [...prev, payload.new as Program])
          } else if (payload.eventType === 'UPDATE') {
            setActivities(prev => 
              prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
            )
          } else if (payload.eventType === 'DELETE') {
            setActivities(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    loadActivities()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { programs, loading, error, setPrograms }
}

export function useActivityActions(organizationId: string) {
  const createActivity = async (programData: Omit<Program, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('activities')
      .insert({ ...programData, organization_id: organizationId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateActivity = async (id: string, updates: Partial<Program>) => {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteActivity = async (id: string) => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error
  }

  return { createActivity, updateActivity, deleteActivity }
}