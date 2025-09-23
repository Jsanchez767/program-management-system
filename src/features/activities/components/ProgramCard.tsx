import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Program } from '../types/program.types'

interface ProgramCardProps {
  program: Program
  onViewDetails: (activityId: string) => void
  onEdit?: (activityId: string) => void
  className?: string
}

export function ProgramCard({ program, onViewDetails, onEdit, className }: ProgramCardProps) {
  const getStatusColor = (status: Program['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{program.name}</CardTitle>
          <Badge className={getStatusColor(program.status)}>
            {program.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {program.description || 'No description provided'}
        </p>
        
        <div className="space-y-2">
          {program.staff && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2">👤</span>
              {program.staff.first_name} {program.staff.last_name}
            </div>
          )}
          
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="mr-2">👥</span>
            {program.current_participants} / {program.max_participants || 'Unlimited'} participants
          </div>
          
          {program.start_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="mr-2">📅</span>
              {new Date(program.start_date).toLocaleDateString()}
              {program.end_date && ` - ${new Date(program.end_date).toLocaleDateString()}`}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent"
            onClick={() => onViewDetails(activity.id)}
          >
            View Details
          </Button>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(activity.id)}
            >
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}