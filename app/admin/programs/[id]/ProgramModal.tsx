"use client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
      <DialogContent className="max-w-2xl w-full p-0">
        <Card className="p-8 rounded-xl shadow-lg border border-muted bg-background">
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-3xl font-extrabold text-primary flex items-center gap-2">
              {program.name}
              {program.category && (
                <Badge variant="secondary" className="ml-2 text-xs px-2 py-1">{program.category}</Badge>
              )}
            </CardTitle>
            <Button onClick={onEdit} className="font-semibold" size="sm" variant="default">Edit</Button>
          </CardHeader>
          <Separator className="my-4" />
          <CardContent>
            <div className="space-y-6">
              {/* Description */}
              <section>
                <Label className="text-xs font-semibold text-muted-foreground mb-1">Activity Description</Label>
                <div className="font-normal text-base whitespace-pre-line leading-relaxed text-foreground bg-muted/10 rounded-lg p-4 mt-1">
                  {program.description || "No description provided"}
                </div>
              </section>
              <Separator />
              {/* Details Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <div className="font-medium text-base">{program.max_participants || "Unlimited"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Badge variant="outline" className="text-xs px-2 py-1">{program.status}</Badge>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="font-medium text-base">{program.start_date ? new Date(program.start_date).toLocaleDateString() : "-"}</div>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="font-medium text-base">{program.end_date ? new Date(program.end_date).toLocaleDateString() : "-"}</div>
                </div>
                <div className="space-y-2">
                  <Label>Instructor</Label>
                  <div className="font-medium text-base">{program.instructor_id || "-"}</div>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
