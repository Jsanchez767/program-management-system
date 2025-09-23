import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Program } from '../types/program.types'

const supabase = createClient()

export function usePrograms(organizationId: string) {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) {
      setLoading(false)
      return
    }

    let isMounted = true

    const loadPrograms = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('programs')
          .select(`
            *,
            instructor:instructor_id (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('organization_id', organizationId)

        if (fetchError) throw fetchError

        if (isMounted) {
          setPrograms(data || [])
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
            setPrograms(prev => [...prev, payload.new as Program])
          } else if (payload.eventType === 'UPDATE') {
            setPrograms(prev => 
              prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p)
            )
          } else if (payload.eventType === 'DELETE') {
            setPrograms(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    loadPrograms()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { programs, loading, error, setPrograms }
}

export function useProgramActions(organizationId: string) {
  const createProgram = async (programData: Omit<Program, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('programs')
      .insert({ ...programData, organization_id: organizationId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateProgram = async (id: string, updates: Partial<Program>) => {
    const { data, error } = await supabase
      .from('programs')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const deleteProgram = async (id: string) => {
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error
  }

  return { createProgram, updateProgram, deleteProgram }
}