"use client"
import { Button } from "@/components/ui/button"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRealtimePrograms } from "@/lib/realtime-hooks"

export default function ProgramModal({ programId, open, onOpenChange, onEdit, organizationId }: { programId: string, open: boolean, onOpenChange: (open: boolean) => void, onEdit: () => void, organizationId: string }) {
  const [program, setProgram] = useState<any>(null)
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
      <DialogContent className="max-w-2xl">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{program.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="text-muted-foreground">{program.description || "No description provided"}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div>{program.category || "-"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <div>{program.max_participants || "Unlimited"}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div>{program.start_date ? new Date(program.start_date).toLocaleDateString() : "-"}</div>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div>{program.end_date ? new Date(program.end_date).toLocaleDateString() : "-"}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <div>{program.instructor_id || "-"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>{program.status}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
