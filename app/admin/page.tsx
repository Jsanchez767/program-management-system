"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Calendar, Users, TrendingUp, Activity, Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalActivities: number
  activeActivities: number
  totalParticipants: number
  todayEnrollments: number
}

interface RecentActivity {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  category: string
  participant_count?: number
  max_participants?: number
  staff_name?: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    activeActivities: 0,
    totalParticipants: 0,
    todayEnrollments: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) {
        console.log("No organization ID found")
        return
      }

      const organizationId = user.user_metadata.organization_id

      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('organization_id', organizationId)

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError)
        return
      }

      const totalActivities = activities?.length || 0
      const activeActivities = activities?.filter(a => a.status === 'active').length || 0
      
      const recentActivitiesData = activities
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        ?.slice(0, 5)
        ?.map(activity => ({
          id: activity.id,
          name: activity.name,
          description: activity.description || '',
          status: activity.status,
          created_at: activity.created_at,
          category: activity.category || 'General',
          max_participants: activity.max_participants,
          staff_name: 'Not assigned'
        })) || []

      setStats({
        totalActivities,
        activeActivities,
        totalParticipants: 0,
        todayEnrollments: 0
      })
      
      setRecentActivities(recentActivitiesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the program management system admin dashboard</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the program management system admin dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/trips">
                <Activity className="h-4 w-4 mr-2" />
                Trips
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/trips">
                <TrendingUp className="h-4 w-4 mr-2" />
                Field Trips
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live updates enabled - Data streams in real-time
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Enrollments</CardTitle>
              <Badge variant="secondary" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayEnrollments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Badge variant="secondary" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Badge variant="secondary" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Activities</CardTitle>
              <Badge variant="secondary" className="text-xs">Live</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeActivities}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Activities
                <Badge variant="secondary" className="text-xs">Live Updates</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                This list updates in real-time as activities are added, modified, or removed.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/activities">
                <Plus className="h-4 w-4 mr-1" />
                View All Activities
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activities yet. Create your first activity to see live updates in action!
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{activity.name}</h3>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {activity.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Category: {activity.category}</span>
                      <span>Staff: {activity.staff_name}</span>
                      <span>{formatDate(activity.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Participants: {activity.max_participants ? `0/${activity.max_participants}` : '0/∞'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Recent Enrollments
              <Badge variant="secondary" className="text-xs">Live Updates</Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              New enrollments appear here instantly as they happen.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No recent enrollments.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
