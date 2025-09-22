"use client"
import EditProgramModal from "./[id]/EditProgramModal"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRealtimePrograms } from "@/lib/realtime-hooks"
import { useUser } from "@/hooks/use-user"
import { useEffect, useState } from "react"
import ProgramModal from "./[id]/ProgramModal"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminProgramsPage() {
  const { user } = useUser()
  const organizationId = user?.user_metadata?.organization_id
  const programs = useRealtimePrograms(organizationId || "")
  const isLoading = !organizationId

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

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProgramId, setEditProgramId] = useState<string | null>(null)

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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedProgramId(program.id)
                          setModalOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setEditProgramId(program.id)
                          setEditModalOpen(true)
                        }}
                      >
                        Edit
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
          {/* Program Details Modal */}
          {selectedProgramId && (
            <ProgramModal
              programId={selectedProgramId}
              open={modalOpen}
              onOpenChange={(open) => {
                setModalOpen(open)
                if (!open) setSelectedProgramId(null)
              }}
            />
          )}
          {/* Edit Program Modal */}
          {editProgramId && (
            <EditProgramModal
              programId={editProgramId}
              open={editModalOpen}
              onOpenChange={(open) => {
                setEditModalOpen(open)
                if (!open) setEditProgramId(null)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
