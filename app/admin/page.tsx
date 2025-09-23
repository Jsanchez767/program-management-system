"use client"

import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { StatsCard } from "@/components/admin/stats-card"
import { RealtimeDashboard } from "@/components/realtime-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Users, BookOpen, ShoppingCart, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { ProgramWithInstructor } from "@/lib/types/database"
import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        // Get organization_id from user metadata only
        let organizationId = user?.user_metadata?.organization_id
        
        // If user has no organization_id in metadata, create a default organization
        if (!organizationId) {
          console.log('No organization found in user metadata, creating unique organization')
          
          // Create a unique organization for this user
          const userEmail = user.email || 'user'
          const orgName = `${user.user_metadata?.first_name || 'User'}'s Organization`
          const orgDomain = `${userEmail.split('@')[0]}-${Date.now()}.local`
          
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({
              name: orgName,
              domain: orgDomain,
              admin_id: user.id,
              settings: {
                allow_self_registration: true,
                default_role: 'student',
                features: {
                  custom_fields: true,
                  analytics: true,
                  realtime: true
                }
              }
            })
            .select()
            .single()

          if (!orgError && newOrg) {
            organizationId = newOrg.id

            // Update user metadata with organization_id
            await supabase.auth.updateUser({
              data: {
                ...user.user_metadata,
                organization_id: organizationId,
                role: user.user_metadata?.role || 'admin' // Ensure role is set
              }
            })

            console.log('✅ Default organization created and assigned to user metadata')
          }
        }
        
        if (!organizationId) return

        const [statsResult, programsResult] = await Promise.all([
          supabase.rpc('get_organization_analytics', { org_id: organizationId }),
          supabase
            .from('programs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(5)
        ])

        if (statsResult.data) {
          setDashboardData(prev => ({
            ...prev,
            stats: statsResult.data
          }))
        }

        if (programsResult.data) {
          // Enhance programs with instructor info from user metadata
          const programsWithInstructors = await Promise.all(
            programsResult.data.map(async (program) => {
              if (program.instructor_id) {
                // Get instructor info from auth.users via RPC
                const { data: instructorData } = await supabase
                  .rpc('get_instructors_for_organization', { org_id: organizationId })
                
                const instructor = instructorData?.find((inst: any) => inst.id === program.instructor_id)
                return {
                  ...program,
                  instructor: instructor || null
                }
              }
              return { ...program, instructor: null }
            })
          )

          setDashboardData(prev => ({
            ...prev,
            recentPrograms: programsWithInstructors
          }))
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [supabase])

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

            {/* Tabs for different dashboard views */}
            <Tabs defaultValue="realtime" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="realtime">🔴 Live Dashboard</TabsTrigger>
                <TabsTrigger value="legacy">📊 Legacy Dashboard</TabsTrigger>
              </TabsList>

              <TabsContent value="realtime" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    Live updates enabled - Data streams in real-time
                  </span>
                </div>
                <RealtimeDashboard />
              </TabsContent>

              <TabsContent value="legacy" className="space-y-6">
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
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}