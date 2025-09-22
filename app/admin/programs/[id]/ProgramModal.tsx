import { Button } from "@/components/ui/button"
"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRealtimePrograms } from "@/lib/realtime-hooks"

export default function ProgramModal({ programId, open, onOpenChange, onEdit }: { programId: string, open: boolean, onOpenChange: (open: boolean) => void, onEdit: () => void }) {
  const [program, setProgram] = useState<any>(null)
  const organizationId = typeof window !== "undefined" ? window.localStorage.getItem("organizationId") || "" : ""
  const programs = useRealtimePrograms(organizationId)

  useEffect(() => {
    if (programs && programId) {
      const found = programs.find((p: any) => p.id === programId)
      setProgram(found)
    }
  }, [programs, programId])

  if (!program) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="flex items-center justify-between">
          <div>
            <DialogTitle>{program.name}</DialogTitle>
            <DialogDescription>{program.description}</DialogDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
        </DialogHeader>
        <div className="mt-4">
          <div><strong>Status:</strong> {program.status}</div>
          <div><strong>Start Date:</strong> {program.start_date}</div>
          <div><strong>End Date:</strong> {program.end_date}</div>
          <div><strong>Max Participants:</strong> {program.max_participants}</div>
          {/* Add more fields as needed */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
