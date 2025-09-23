"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Badge } from "@/shared/components/ui/badge"
import { Trash2, Send, Copy, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/shared/hooks/use-toast"
import type { OrganizationInvite, Organization } from "@/lib/types/database"

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<OrganizationInvite[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("participant")
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
      if (!user) {
        console.error('No user found')
        return
      }

      console.log('Loading organization for user:', user.id)
      console.log('User metadata:', user.user_metadata)

      // Try multiple ways to get organization_id
      let organizationId = user.user_metadata?.organization_id

      // If not in metadata, try to find organization where user is admin
      if (!organizationId) {
        console.log('No organization_id in metadata, trying admin lookup...')
        const { data: adminOrg, error: adminError } = await supabase
          .from('organizations')
          .select('*')
          .eq('admin_id', user.id)
          .single()
        
        console.log('Admin lookup result:', { adminOrg, adminError })
        
        if (adminOrg) {
          organizationId = adminOrg.id
          setOrganization(adminOrg)
          console.log('Found organization via admin lookup:', adminOrg)
          return
        }
      }

      // If we have organizationId from metadata, fetch the organization
      if (organizationId) {
        console.log('Fetching organization by ID:', organizationId)
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single()
        
        console.log('Organization fetch result:', { org, error })
        
        if (error) {
          console.error('Error fetching organization:', error)
        } else {
          setOrganization(org)
          console.log('Organization set:', org)
        }
      } else {
        console.error('No organization ID found anywhere')
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
    if (!organization) {
      console.error('No organization found')
      toast({
        title: "Error",
        description: "Organization not found. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Error",
        description: "Please enter both first and last name.",
        variant: "destructive",
      })
      return
    }

    console.log('Sending invitation:', { organization, email, firstName, lastName, role })

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Current user:', user.id)
      console.log('Organization ID:', organization.id)

      // Step 1: Create the invitation record
      const invitationData = {
        organization_id: organization.id,
        email: email,
        role: role,
        invited_by: user.id,
        first_name: firstName,
        last_name: lastName,
        status: 'pending'
      }

      console.log('Invitation data to insert:', invitationData)

      const { data: invitation, error } = await supabase
        .from('invitations')
        .insert(invitationData)
        .select()
        .single()

      console.log('Supabase response:', { invitation, error })

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      // Step 2: Create the user account via API
      console.log('Creating user account...')
      const createUserResponse = await fetch('/api/invitations/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          organizationId: organization.id,
          organizationName: organization.name,
          invitationId: invitation.id
        }),
      })

      const createUserResult = await createUserResponse.json()
      
      if (!createUserResponse.ok) {
        throw new Error(createUserResult.error || 'Failed to create user account')
      }

      console.log('User created successfully:', createUserResult)
      
      toast({
        title: "Invitation sent!",
        description: `User account created for ${firstName} ${lastName}. Confirmation email sent to ${email}.`,
      })

      // Reset form
      setEmail("")
      setFirstName("")
      setLastName("")
      setRole("participant")
      
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

  const resendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/invitations/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation')
      }

      toast({
        title: "Invitation resent!",
        description: result.message,
      })

      // Reload invitations to show updated status
      loadInvitations()
    } catch (error) {
      console.error('Error resending invitation:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend invitation",
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
    
    if (invitation.status === 'user_created') {
      return <Badge variant="default" className="bg-blue-100 text-blue-800"><Send className="w-3 h-3 mr-1" />Awaiting Confirmation</Badge>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
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
                    <SelectItem value="participant">Student</SelectItem>
                    <SelectItem value="staff">Instructor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Creating User..." : "Send Invitation"}
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
                  <TableHead>Name</TableHead>
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
                    <TableCell className="font-medium">
                      {invitation.first_name && invitation.last_name 
                        ? `${invitation.first_name} ${invitation.last_name}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation)}</TableCell>
                    <TableCell>{new Date(invitation.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invitation.expires_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!invitation.accepted_at && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendInvitation(invitation.id)}
                            title="Resend invitation"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        {!invitation.accepted_at && new Date(invitation.expires_at) > new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invitation.token)}
                            title="Copy invitation link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteInvitation(invitation.id)}
                          title="Delete invitation"
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