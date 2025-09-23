"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InstructorSidebar } from "@/shared/components/layout/InstructorSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

export default function NewFieldTripPage() {
  const [formData, setFormData] = useState({
    program_id: "",
    title: "",
    description: "",
    destination: "",
    trip_date: "",
    departure_time: "",
    return_time: "",
    transportation: "",
    cost_per_student: "",
    max_participants: "",
    educational_objectives: "",
    safety_considerations: "",
    status: "draft",
  })
  const [permissions, setPermissions] = useState<string[]>([""])
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadPrograms = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("programs")
        .select("id, name")
        .eq("instructor_id", user.id)
        .eq("status", "active")
        .order("name")
      setPrograms(data || [])
    }
    loadPrograms()
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

      const { error } = await supabase.from("field_trips").insert({
        program_id: formData.program_id,
        instructor_id: user.id,
        title: formData.title,
        description: formData.description || null,
        destination: formData.destination,
        trip_date: formData.trip_date,
        departure_time: formData.departure_time || null,
        return_time: formData.return_time || null,
        transportation: formData.transportation || null,
        cost_per_student: formData.cost_per_student ? Number.parseFloat(formData.cost_per_student) : null,
        max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : null,
        educational_objectives: formData.educational_objectives || null,
        safety_considerations: formData.safety_considerations || null,
        required_permissions: permissions.filter((perm) => perm.trim() !== ""),
        status: formData.status,
        submitted_at: formData.status === "submitted" ? new Date().toISOString() : null,
      })

      if (error) throw error

      router.push("/instructor/field-trips")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addPermission = () => {
    setPermissions([...permissions, ""])
  }

  const updatePermission = (index: number, value: string) => {
    const newPermissions = [...permissions]
    newPermissions[index] = value
    setPermissions(newPermissions)
  }

  const removePermission = (index: number) => {
    setPermissions(permissions.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <InstructorSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/instructor/field-trips">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Request Field Trip</h1>
              <p className="text-muted-foreground mt-2">Submit a field trip request for approval</p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Field Trip Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program *</Label>
                    <Select
                      value={formData.program_id}
                      onValueChange={(value) => updateFormData("program_id", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
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
                        <SelectItem value="submitted">Submit for Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Field Trip Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder="Enter field trip title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => updateFormData("destination", e.target.value)}
                    placeholder="Where will the field trip take place?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Brief description of the field trip"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trip_date">Trip Date *</Label>
                    <Input
                      id="trip_date"
                      type="date"
                      value={formData.trip_date}
                      onChange={(e) => updateFormData("trip_date", e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departure_time">Departure Time</Label>
                    <Input
                      id="departure_time"
                      type="time"
                      value={formData.departure_time}
                      onChange={(e) => updateFormData("departure_time", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="return_time">Return Time</Label>
                    <Input
                      id="return_time"
                      type="time"
                      value={formData.return_time}
                      onChange={(e) => updateFormData("return_time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transportation">Transportation</Label>
                    <Input
                      id="transportation"
                      value={formData.transportation}
                      onChange={(e) => updateFormData("transportation", e.target.value)}
                      placeholder="e.g., School bus, Walking"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost_per_student">Cost per Student ($)</Label>
                    <Input
                      id="cost_per_student"
                      type="number"
                      step="0.01"
                      value={formData.cost_per_student}
                      onChange={(e) => updateFormData("cost_per_student", e.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => updateFormData("max_participants", e.target.value)}
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educational_objectives">Educational Objectives</Label>
                  <Textarea
                    id="educational_objectives"
                    value={formData.educational_objectives}
                    onChange={(e) => updateFormData("educational_objectives", e.target.value)}
                    placeholder="What will students learn from this field trip?"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safety_considerations">Safety Considerations</Label>
                  <Textarea
                    id="safety_considerations"
                    value={formData.safety_considerations}
                    onChange={(e) => updateFormData("safety_considerations", e.target.value)}
                    placeholder="Describe safety measures and considerations"
                    rows={3}
                  />
                </div>

                {/* Required Permissions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Required Permissions/Forms</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPermission}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Permission
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {permissions.map((permission, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={permission}
                          onChange={(e) => updatePermission(index, e.target.value)}
                          placeholder={`Permission/form ${index + 1}`}
                        />
                        {permissions.length > 1 && (
                          <Button type="button" variant="outline" size="icon" onClick={() => removePermission(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : formData.status === "submitted" ? "Submit for Approval" : "Save Draft"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/instructor/field-trips">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
