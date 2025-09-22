"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRealtimePrograms } from "@/lib/realtime-hooks"

export default function ProgramModal({ programId, open, onOpenChange }: { programId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [program, setProgram] = useState<any>(null)
  const programs = useRealtimePrograms("") // You may want to pass organizationId here

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
        <DialogHeader>
          <DialogTitle>{program.name}</DialogTitle>
          <DialogDescription>{program.description}</DialogDescription>
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
