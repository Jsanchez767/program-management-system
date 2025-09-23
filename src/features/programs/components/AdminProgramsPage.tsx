"use client"

import { useState } from "react"
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Button } from "@/ui/button"
import Link from "next/link"
import { useUser } from "@/shared/hooks/use-user"
import { ProgramGrid } from "@/features/programs/components/ProgramGrid"
import ProgramModal from "./[id]/ProgramModal"
import EditProgramModal from "./[id]/EditProgramModal"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

export default function AdminProgramsPage() {
  const { user } = useUser()
  const organizationId = user?.user_metadata?.organization_id

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProgramId, setEditProgramId] = useState<string | null>(null)

  const handleProgramSelect = (programId: string) => {
    setSelectedProgramId(programId)
    setModalOpen(true)
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
              <p className="text-muted-foreground mt-2">
                Manage all educational programs and activities
              </p>
            </div>
            <Button asChild>
              <Link href="/admin/programs/new">
                <span className="mr-2">➕</span>
                New Program
              </Link>
            </Button>
          </div>

          {/* Programs Grid - Now using the new component */}
          {organizationId && (
            <ProgramGrid
              organizationId={organizationId}
              onProgramSelect={handleProgramSelect}
              showAddButton={true}
            />
          )}

          {/* Program Details Modal */}
          {selectedProgramId && (
            <ProgramModal
              programId={selectedProgramId}
              open={modalOpen}
              onOpenChange={(open) => {
                setModalOpen(open)
                if (!open) setSelectedProgramId(null)
              }}
              onOptimisticUpdate={() => {
                // Handle optimistic updates if needed
              }}
              organizationId={organizationId || ""}
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