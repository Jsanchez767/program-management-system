"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

export default function NewLessonPlanPage() {
  const [formData, setFormData] = useState({
    activity_id: "",
    title: "",
    description: "",
    lesson_date: "",
    duration_minutes: "",
    activities: "",
    notes: "",
    status: "draft",
  })
  const [objectives, setObjectives] = useState<string[]>([""])
  const [materials, setMaterials] = useState<string[]>([""])
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadActivities = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("activities")
        .select("id, name")
        .eq("staff_id", user.id)
        .eq("status", "active")
        .order("name")
      setActivities(data || [])
    }
    loadActivities()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("lesson_plans").insert({
        activity_id: formData.activity_id,
        staff_id: user.id,
        title: formData.title,
        description: formData.description || null,
        lesson_date: formData.lesson_date,
        duration_minutes: formData.duration_minutes ? Number.parseInt(formData.duration_minutes) : null,
        objectives: objectives.filter((obj) => obj.trim() !== ""),
        materials_needed: materials.filter((mat) => mat.trim() !== ""),
        activities: formData.activities || null,
        notes: formData.notes || null,
        status: formData.status,
      })

      if (error) throw error

      router.push("/staff/lesson-plans")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addObjective = () => {
    setObjectives([...objectives, ""])
  }

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives]
    newObjectives[index] = value
    setObjectives(newObjectives)
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const addMaterial = () => {
    setMaterials([...materials, ""])
  }

  const updateMaterial = (index: number, value: string) => {
    const newMaterials = [...materials]
    newMaterials[index] = value
    setMaterials(newMaterials)
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/staff/lesson-plans">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Lesson Plan</h1>
              <p className="text-muted-foreground mt-2">
                Plan your next lesson with structured objectives and activities
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Lesson Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program *</Label>
                    <Select
                      value={formData.activity_id}
                      onValueChange={(value) => updateFormData("activity_id", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder="Enter lesson title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Brief description of the lesson"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lesson_date">Lesson Date *</Label>
                    <Input
                      id="lesson_date"
                      type="date"
                      value={formData.lesson_date}
                      onChange={(e) => updateFormData("lesson_date", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => updateFormData("duration_minutes", e.target.value)}
                      placeholder="e.g., 60"
                      min="1"
                    />
                  </div>
                </div>

                {/* Learning Objectives */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Learning Objectives</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addObjective}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Objective
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {objectives.map((objective, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={objective}
                          onChange={(e) => updateObjective(index, e.target.value)}
                          placeholder={`Learning objective ${index + 1}`}
                        />
                        {objectives.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeObjective(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Needed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Materials Needed</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Material
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {materials.map((material, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={material}
                          onChange={(e) => updateMaterial(index, e.target.value)}
                          placeholder={`Material ${index + 1}`}
                        />
                        {materials.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removeMaterial(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activities">Activities & Procedures</Label>
                  <Textarea
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => updateFormData("activities", e.target.value)}
                    placeholder="Describe the lesson activities and procedures"
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => updateFormData("notes", e.target.value)}
                    placeholder="Any additional notes or reminders"
                    rows={3}
                  />
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Lesson Plan"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/staff/lesson-plans">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
    </div>
  )
}
