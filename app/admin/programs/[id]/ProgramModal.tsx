"use client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRealtimePrograms } from "@/lib/realtime-hooks"
export default function ProgramModal({ programId, open, onOpenChange, onEdit, organizationId }: { programId: string, open: boolean, onOpenChange: (open: boolean) => void, onEdit: (updated?: any) => void, organizationId: string }) {
  const [program, setProgram] = useState<any>(null)
  const programs = useRealtimePrograms(organizationId)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    if (programs && programId) {
      const found = programs.find((p: any) => p.id === programId)
      setProgram(found)
      setForm(found)
    }
  }, [programs, programId])

  if (!program) return null

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleCancel = () => {
    setEditMode(false)
    setForm(program)
  }

  const handleChange = async (field: string, value: any) => {
    const updated = { ...form, [field]: value }
    setForm(updated)
    setProgram(updated)
    // Backend auto-save
    try {
      await fetch(`/api/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })
      // Optionally show a toast or loading indicator here
    } catch (err) {
      // Optionally handle error (e.g., show toast)
      console.error('Failed to save', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0">
        <Card className="p-8 rounded-xl shadow-lg border border-muted bg-background">
          <CardHeader className="pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Program Details</h2>
              {editMode ? (
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              ) : (
                <Button variant="outline" onClick={handleEdit}>Edit</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Program Name *</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={form.name || ""}
                      onChange={e => handleChange('name', e.target.value)}
                      required
                    />
                  ) : (
                    <div className="text-lg font-semibold">{program.name}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  {editMode ? (
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      value={form.description || ""}
                      onChange={e => handleChange('description', e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <div className="text-muted-foreground">{program.description || "No description provided"}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={form.category || ""}
                      onChange={e => handleChange('category', e.target.value)}
                    />
                  ) : (
                    <div>{program.category || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Participants</label>
                  {editMode ? (
                    <input
                      type="number"
                      className="w-full border rounded px-3 py-2"
                      value={form.max_participants || ""}
                      onChange={e => handleChange('max_participants', e.target.value)}
                      placeholder="Leave empty for unlimited"
                    />
                  ) : (
                    <div>{program.max_participants || "Unlimited"}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={form.start_date ? form.start_date.slice(0,10) : ""}
                      onChange={e => handleChange('start_date', e.target.value)}
                    />
                  ) : (
                    <div>{program.start_date ? new Date(program.start_date).toLocaleDateString() : "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      className="w-full border rounded px-3 py-2"
                      value={form.end_date ? form.end_date.slice(0,10) : ""}
                      onChange={e => handleChange('end_date', e.target.value)}
                    />
                  ) : (
                    <div>{program.end_date ? new Date(program.end_date).toLocaleDateString() : "-"}</div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Instructor</label>
                  {editMode ? (
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={form.instructor_id || ""}
                      onChange={e => handleChange('instructor_id', e.target.value)}
                    >
                      <option value="">Select an instructor</option>
                      {/* TODO: Populate with actual instructor options */}
                      <option value="instructor1">Instructor 1</option>
                      <option value="instructor2">Instructor 2</option>
                    </select>
                  ) : (
                    <div>{program.instructor_id || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  {editMode ? (
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={form.status || ""}
                      onChange={e => handleChange('status', e.target.value)}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  ) : (
                    <div>{program.status || "-"}</div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                {editMode ? (
                  <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
                ) : (
                  <Button onClick={handleEdit}>Edit</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
