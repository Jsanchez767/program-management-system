
"use client"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/shared/components/ui/button"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent } from "@/shared/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { useRealtimeActivities } from "@/lib/realtime-hooks"

type ProgramModalProps = {
  activityId: string,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onOptimisticUpdate?: (updated: any) => void,
  organizationId: string
}

export default function ProgramModal({ activityId, open, onOpenChange, onOptimisticUpdate, organizationId }: ProgramModalProps) {
  // Defensive: Only run hooks inside the function
  const [program, setProgram] = useState<any>(null)
  const programs = useRealtimeActivities(organizationId)
  const [editMode, setEditMode] = useState(false)
  // Local state for input fields, separate from saved program
  const [form, setForm] = useState<any>(null)
  const [inputState, setInputState] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputBuffer = useRef<any>({})

  // Defensive: Only update state if programs and activityId are valid
  useEffect(() => {
    if (Array.isArray(programs) && activityId) {
      const found = programs.find((p: any) => p.id === activityId)
      setProgram(found || null)
      setForm(found || null)
      setInputState(found || null)
    }
  }, [programs, activityId])

  // Show nothing while fetching program data
  if (!program && Array.isArray(programs)) {
    return null;
  }
  // Show error only if programs is loaded and program is still missing
  if (!program && Array.isArray(programs) && programs.length > 0) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
        <div className="text-lg font-semibold mb-2">Unable to load program details.</div>
        <div className="text-muted-foreground mb-4">The selected program could not be found or loaded.</div>
        <button className="mt-4 px-4 py-2 bg-gray-200 rounded" onClick={() => onOpenChange(false)}>Close</button>
      </div>
    )
  }

  // Debounced save logic
  const saveField = async (field: string, value: any) => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch(`/api/programs/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1200)
    } catch (err) {
      setError('Failed to save')
      if (typeof window !== "undefined") {
        window.console.error('Failed to save', err)
      }
    } finally {
      setSaving(false)
    }
  }

  // Defensive: Only update form and save if form is valid
  // Update local input state, save in background
  const handleChange = (field: string, value: any) => {
    if (!inputState) return
    setInputState((prev: any) => ({ ...prev, [field]: value }))
    setError(null)
    inputBuffer.current = { ...inputState, [field]: value }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveField(field, value)
    }, 400)
  }

  const handleEdit = () => setEditMode(true)
  const handleCancel = () => {
    setEditMode(false)
    setInputState(program)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <Card className="p-8 rounded-xl shadow-lg border border-muted bg-background">
          <CardHeader className="pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Program Details</h2>
            <div className="flex items-center gap-2">
              {editMode ? (
                <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              ) : (
                <Button variant="outline" onClick={handleEdit}>Edit</Button>
              )}
              {editMode && (
                <span className="flex items-center text-xs text-muted-foreground ml-2">
                  {saving ? (
                    <Loader2 className="animate-spin w-4 h-4 mr-1" />
                  ) : saved ? (
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  ) : null}
                  {saving ? "Saving..." : saved ? "Saved" : ""}
                  {error && <span className="text-red-500 ml-2">{error}</span>}
                </span>
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
                      value={inputState?.name || ""}
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
                      value={inputState?.description || ""}
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
                      value={inputState?.category || ""}
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
                      value={inputState?.max_participants || ""}
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
                      value={inputState?.start_date ? inputState.start_date.slice(0,10) : ""}
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
                      value={inputState?.end_date ? inputState.end_date.slice(0,10) : ""}
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
                      value={inputState?.staff_id || ""}
                      onChange={e => handleChange('staff_id', e.target.value)}
                    >
                      <option value="">Select an staff</option>
                      {/* TODO: Populate with actual staff options */}
                      <option value="staff1">Instructor 1</option>
                      <option value="staff2">Instructor 2</option>
                    </select>
                  ) : (
                    <div>{program.staff_id || "-"}</div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Status</label>
                  {editMode ? (
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={inputState?.status || ""}
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
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
