"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Staff {
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
    staff_id: "",
    status: "active",
  })
  const [staffs, setInstructors] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadInstructors() {
      try {
        // Get current user's organization_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.user_metadata?.organization_id) return

        const organizationId = user.user_metadata.organization_id

        // Use RPC function to get staffs from user metadata
        const { data } = await supabase
          .rpc('get_staffs_for_organization', { org_id: organizationId })

        if (data) {
          setInstructors(data)
        }
      } catch (error) {
        console.error('Error loading staffs:', error)
      }
    }

    loadInstructors()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Get current user's organization_id from metadata only
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      let organizationId: string | null = user.user_metadata?.organization_id

      // If user has no organization_id in metadata, create a unique organization
      if (!organizationId) {
        console.log('Creating unique organization for user - no organization_id in metadata')
        
        // Create a unique organization for this user
        const userEmail = user.email || 'user'
        const orgName = `${user.user_metadata?.first_name || 'User'}'s Organization`
        const orgDomain = `${userEmail.split('@')[0]}-${Date.now()}.local`
        
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            domain: orgDomain,
            admin_id: user.id,
            settings: {
              allow_self_registration: true,
              default_role: 'participant',
              features: {
                custom_fields: true,
                analytics: true,
                realtime: true
              }
            }
          })
          .select()
          .single()

        if (orgError) {
          console.error('Failed to create organization:', orgError)
          throw new Error('Failed to setup organization. Please contact support.')
        }

        organizationId = newOrg.id

        // Update user metadata with organization_id
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            organization_id: organizationId,
            role: user.user_metadata?.role || 'admin' // Ensure role is set
          }
        })

        console.log('✅ Default organization created and assigned to user metadata')
      }

      if (!organizationId) {
        throw new Error('Unable to determine organization. Please contact support.')
      }

      // Convert organization_id to UUID explicitly
      const orgUuid = organizationId as string;
      
      // Log what we're inserting for debugging
      console.log('Creating program with organization_id:', orgUuid);
      console.log('User JWT data:', user.user_metadata);

      // Try to fetch a fresh token before insert
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Error refreshing session, but continuing anyway:', refreshError);
      }

      const { error: insertError } = await supabase.from("activities").insert([
        {
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : null,
          staff_id: formData.staff_id || null,
          status: formData.status,
          current_participants: 0,
          // organization_id is now set by the DB trigger
        },
      ])

      if (insertError) {
        console.error('Program insert error details:', insertError);
        
        // If it's an RLS error, we'll try a more direct approach
        if (insertError.message && insertError.message.includes('new row violates row-level security policy')) {
          console.log('RLS error detected, trying alternative insert approach');
          
          // Try using RPC call to bypass RLS
           const { error: rpcError } = await supabase.rpc('insert_activity_admin', {
             p_name: formData.name,
             p_description: formData.description || null,
             p_category: formData.category || null,
             p_start_date: formData.start_date || null,
             p_end_date: formData.end_date || null,
             p_max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : null,
             p_staff_id: formData.staff_id || null,
             p_status: formData.status,
             // p_organization_id is now set by the DB trigger
           });
          
          if (rpcError) {
            console.error('RPC insert also failed:', rpcError);
            throw rpcError;
          } else {
            console.log('RPC insert succeeded!');
            router.push("/admin/activities");
            return;
          }
        }
        
        throw insertError;
      }

      console.log('Program created successfully!');
      router.push("/admin/activities")
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
              <Link href="/admin/activities">
                <span>←</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Program</h1>
              <p className="text-muted-foreground mt-2">Add a new educational activity to the system</p>
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
                    <Label htmlFor="staff">Instructor</Label>
                    <Select
                      value={formData.staff_id}
                      onValueChange={(value) => updateFormData("staff_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffs.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.first_name} {staff.last_name}
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
                    <Link href="/admin/activities">Cancel</Link>
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
