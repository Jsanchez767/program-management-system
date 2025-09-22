"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRealtimePrograms } from "@/lib/realtime-hooks"
import { createClient } from "@/lib/supabase/client"

export default function EditProgramModal({ programId, open, onOpenChange }: { programId: string, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [program, setProgram] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const programs = useRealtimePrograms("") // You may want to pass organizationId here

  useEffect(() => {
    if (programs && programId) {
      const found = programs.find((p: any) => p.id === programId)
      setProgram(found)
      setForm(found ? { ...found } : {})
    }
  }, [programs, programId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { error } = await supabase
      .from('programs')
      .update({ ...form })
      .eq('id', programId)
    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }
    setSaving(false)
    onOpenChange(false)
  }

  if (!program) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Program: {program.name}</DialogTitle>
          <DialogDescription>Update program details in real-time.</DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <Input name="name" value={form.name || ""} onChange={handleChange} placeholder="Program Name" />
          <Input name="description" value={form.description || ""} onChange={handleChange} placeholder="Description" />
          {/* Add more fields as needed */}
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">{error}</div>}
        <div className="mt-4 flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
