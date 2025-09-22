"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Send, Copy, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { OrganizationInvite, Organization } from "@/lib/types/database"

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<OrganizationInvite[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("student")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadInvitations()
    loadOrganization()
  }, [])

  const loadOrganization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Try to get organization_id from user metadata
      let organizationId = user.user_metadata?.organization_id

      // Fallback: fetch organization_id from organizations table using user id
      if (!organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id)
          .single()
        organizationId = org?.id
      }
      if (organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()
        setOrganization(org)
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    }
  }

  const loadInvitations = async () => {
    try {
      setIsLoadingInvitations(true)
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])
    } catch (error) {
      console.error('Error loading invitations:', error)
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      })
    } finally {
      setIsLoadingInvitations(false)
    }
  }

  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization) return

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          organization_id: organization.id,
          email: email,
          role: role,
          invited_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      // Generate invitation link
      const inviteLink = `${window.location.origin}/auth/invitation?token=${data.token}`
      
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${email}`,
      })

      // Reset form
      setEmail("")
      setRole("student")
      
      // Reload invitations
      loadInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/auth/invitation?token=${token}`
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Invitation deleted",
        description: "Invitation has been removed",
      })
      
      loadInvitations()
    } catch (error) {
      console.error('Error deleting invitation:', error)
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (invitation: OrganizationInvite) => {
    if (invitation.accepted_at) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
    }
    
    const isExpired = new Date(invitation.expires_at) < new Date()
    if (isExpired) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
    }
    
    return <Badge variant="secondary"><Send className="w-3 h-3 mr-1" />Pending</Badge>
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Invitations</h1>
        <p className="text-muted-foreground">
          Invite people to join {organization.name}
        </p>
      </div>

      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Send Invitation</CardTitle>
          <CardDescription>
            Invite a new team member to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendInvitation} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invitations</CardTitle>
          <CardDescription>
            Manage sent invitations to your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvitations ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading invitations...</p>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invitations sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation)}</TableCell>
                    <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!invitation.accepted_at && new Date(invitation.expires_at) > new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invitation.token)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}