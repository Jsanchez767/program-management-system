"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Instructor {
  id: string
  first_name: string
  last_name: string
}

export default function NewProgramPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    start_date: "",
    end_date: "",
    max_participants: "",
    instructor_id: "",
    status: "active",
  })
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadInstructors() {
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .eq("role", "instructor")
        .order("first_name")

      if (data) {
        setInstructors(data)
      }
    }

    loadInstructors()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get current user's organization_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found for user')

      const { error: insertError } = await supabase.from("programs").insert([
        {
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : null,
          instructor_id: formData.instructor_id || null,
          status: formData.status,
          current_participants: 0,
          organization_id: profile.organization_id,
        },
      ])

      if (insertError) {
        throw insertError
      }

      router.push("/admin/programs")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/programs">
                <span>←</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Program</h1>
              <p className="text-muted-foreground mt-2">Add a new educational program to the system</p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Enter program name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Describe the program objectives and activities"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => updateFormData("category", e.target.value)}
                      placeholder="e.g., Arts, STEM, Sports"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => updateFormData("max_participants", e.target.value)}
                      placeholder="Leave empty for unlimited"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateFormData("start_date", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateFormData("end_date", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Select
                      value={formData.instructor_id}
                      onValueChange={(value) => updateFormData("instructor_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instructor" />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name}
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Program"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/admin/programs">Cancel</Link>
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
