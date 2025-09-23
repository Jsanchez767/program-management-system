import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { ProgramCard } from './ProgramCard'
import { usePrograms } from '../hooks/usePrograms'
import { Program } from '../types/program.types'

interface ProgramGridProps {
  organizationId: string
  onProgramSelect?: (activityId: string) => void
  showAddButton?: boolean
}

export function ProgramGrid({ organizationId, onProgramSelect, showAddButton = true }: ProgramGridProps) {
  const { programs, loading } = usePrograms(organizationId)
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  // Delayed placeholder logic
  useEffect(() => {
    if (!loading && programs.length === 0) {
      const timer = setTimeout(() => {
        setShowPlaceholder(true)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setShowPlaceholder(false)
    }
  }, [loading, programs.length])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (programs.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <ProgramCard
            key={activity.id}
            program={program}
            onViewDetails={onProgramSelect || (() => {})}
          />
        ))}
      </div>
    )
  }

  if (showPlaceholder) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No programs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by creating your first educational program.
                </p>
                {showAddButton && (
                  <Button asChild>
                    <Link href="/admin/programs/new">
                      <span className="mr-2">➕</span>
                      Create Program
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}