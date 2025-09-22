"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Program } from "@/lib/types/database"
import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const supabase = createClient()
        
        // Get current user and their organization from user metadata
  const { data: { user } } = await supabase.auth.getUser()
  console.log('JWT organization_id:', user?.user_metadata?.organization_id)
  console.log('JWT role:', user?.user_metadata?.role)
  if (!user?.user_metadata?.organization_id) return

  const organizationId = user.user_metadata.organization_id

        // Fetch programs for this organization
        const { data: programsData } = await supabase
          .from('programs')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })

        if (programsData) {
          // Enhance programs with instructor info from user metadata
          const programsWithInstructors = await Promise.all(
            programsData.map(async (program) => {
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

          setPrograms(programsWithInstructors)
        }
      } catch (error) {
        console.error('Error fetching programs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Programs</h1>
              <p className="text-muted-foreground mt-2">Manage all educational programs and activities</p>
            </div>
            <Button asChild>
              <Link href="/admin/programs/new">
                <span className="mr-2">➕</span>
                New Program
              </Link>
            </Button>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : programs && programs.length > 0 ? (
              programs.map((program: any) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{program.name}</CardTitle>
                      <Badge className={getStatusColor(program.status)}>{program.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {program.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      {program.instructor && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">👤</span>
                          {program.instructor.first_name} {program.instructor.last_name}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">👥</span>
                        {program.current_participants || 0} / {program.max_participants || "Unlimited"} participants
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
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/admin/programs/${program.id}`}>View Details</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/admin/programs/${program.id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
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
                      <Button asChild>
                        <Link href="/admin/programs/new">
                          <span className="mr-2">➕</span>
                          Create Program
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
