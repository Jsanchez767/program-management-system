"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, ShoppingCart, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ProgramWithInstructor } from "@/lib/types/database"
import { useEffect, useState } from "react"

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPrograms: 0,
      totalParticipants: 0,
      activeAnnouncements: 0,
      pendingDocuments: 0
    },
    recentPrograms: [] as ProgramWithInstructor[]
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = createClient()
        
        // Get current user and their organization
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's profile to get organization_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (!profile?.organization_id) return

        // Fetch dashboard stats
        const [programsData, participantsData, announcementsData, documentsData] = await Promise.all([
          supabase
            .from('programs')
            .select('id')
            .eq('organization_id', profile.organization_id),
          supabase
            .from('program_participants')
            .select('id, programs!inner(organization_id)')
            .eq('programs.organization_id', profile.organization_id),
          supabase
            .from('announcements')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true),
          supabase
            .from('documents')
            .select('id')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'pending')
        ])

        // Get recent programs with instructor info
        const { data: recentPrograms } = await supabase
          .from('programs')
          .select(`
            *,
            instructor:profiles!programs_instructor_id_fkey(
              first_name,
              last_name
            )
          `)
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })
          .limit(5)

        setDashboardData({
          stats: {
            totalPrograms: programsData.data?.length || 0,
            totalParticipants: participantsData.data?.length || 0,
            activeAnnouncements: announcementsData.data?.length || 0,
            pendingDocuments: documentsData.data?.length || 0
          },
          recentPrograms: recentPrograms || []
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Keep default empty state
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const { stats, recentPrograms } = dashboardData

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8 pt-20 lg:pt-6">
          <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the program management system admin dashboard
            </p>
          </div>

          {/* Stats Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Programs"
              value={stats.totalPrograms}
              icon={BookOpen}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Total Participants"
              value={stats.totalParticipants}
              icon={TrendingUp}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Active Announcements"
              value={stats.activeAnnouncements}
              icon={Users}
              trend={{ value: 15, isPositive: true }}
            />
            <StatsCard
              title="Pending Documents"
              value={stats.pendingDocuments}
              icon={Clock}
              trend={{ value: 5, isPositive: false }}
            />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-24 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Purchase Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pending Documents</span>
                    <span className="font-semibold">{stats.pendingDocuments}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="text-sm text-muted-foreground">{stats.pendingDocuments} need review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pending Review</span>
                    <span className="font-semibold">{stats.pendingDocuments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Programs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Recent Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPrograms.length > 0 ? (
                  recentPrograms.map((program: ProgramWithInstructor) => (
                    <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{program.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Instructor: {program.instructor?.first_name} {program.instructor?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Participants: {program.current_participants}
                          {program.max_participants && `/${program.max_participants}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          program.status === 'active' ? 'bg-green-100 text-green-800' :
                          program.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {program.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No programs found</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {stats.pendingDocuments > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {stats.pendingDocuments > 0 && (
                    <p>• {stats.pendingDocuments} documents need review</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          </>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}