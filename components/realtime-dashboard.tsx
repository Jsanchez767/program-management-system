"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/use-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRealtimeDashboard, useRealtimeActivities, useRealtimeEnrollments } from '@/lib/realtime-hooks'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export function RealtimeDashboard() {
  const { user } = useUser()
  const organizationId = user?.user_metadata?.organization_id

  if (!organizationId) {
    return <div>Loading...</div>
  }

  return <DashboardContent organizationId={organizationId} />
}

function DashboardContent({ organizationId }: { organizationId: string }) {
  // Use our realtime hooks
  const activities = useRealtimeActivities(organizationId)
  const { enrollments, newEnrollmentNotification } = useRealtimeEnrollments(organizationId)

  // Calculate live stats from programs and enrollments
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const todayEnrollments = enrollments.filter(e => e.created_at?.slice(0, 10) === today).length
  const weekEnrollments = enrollments.filter(e => new Date(e.created_at) >= weekAgo).length
  const monthEnrollments = enrollments.filter(e => new Date(e.created_at) >= monthAgo).length
  const activeActivities = activities.filter(
    (activity: any) => (activity.status ?? 'active').toLowerCase() === 'active'
  ).length

  // Test function to create a new program (for demonstration)
  const createTestProgram = async () => {
    const { error } = await supabase
      .from('activities')
      .insert({
        name: `Test Program ${Date.now()}`,
        description: 'A test program created from the realtime dashboard',
        organization_id: organizationId,
        custom_fields: {
          difficulty_level: 'beginner',
          max_participants: 25
        }
      })

    if (error) {
      console.error('Error creating activity:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Show live notification */}
      {newEnrollmentNotification && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          🎉 New enrollment in program {newEnrollmentNotification.activityId}!
          <small className="block text-sm">
            {newEnrollmentNotification.timestamp.toLocaleTimeString()}
          </small>
        </div>
      )}

      {/* Live Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Enrollments
            </CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayEnrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Week
            </CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weekEnrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthEnrollments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Programs
            </CardTitle>
            <Badge variant="outline" className="text-xs">Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Programs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Programs
            <Badge variant="outline" className="text-xs">Live Updates</Badge>
          </CardTitle>
          <CardDescription>
            This list updates in real-time as programs are added, modified, or removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-muted-foreground">No programs found.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{activity.name}</h4>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.custom_fields?.difficulty_level && (
                      <Badge variant="secondary" className="mt-1">
                        {activity.custom_fields.difficulty_level}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Test button */}
          <div className="mt-4 pt-4 border-t">
            <Button onClick={createTestProgram} variant="outline">
              Create Test Program (Watch it appear live!)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recent Enrollments
            <Badge variant="outline" className="text-xs">Live Updates</Badge>
          </CardTitle>
          <CardDescription>
            New enrollments appear here instantly as they happen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {enrollments.length === 0 ? (
              <p className="text-muted-foreground">No recent enrollments.</p>
            ) : (
              enrollments.slice(0, 10).map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="text-sm">
                    Student {enrollment.participant_id} enrolled in program {enrollment.activity_id}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(enrollment.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}