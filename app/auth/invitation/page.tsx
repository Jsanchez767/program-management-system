"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import type { OrganizationInvitation } from "@/lib/types/database"

function InvitationContent() {
  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  useEffect(() => {
    if (token) {
      loadInvitation(token)
    } else {
      setError("Invalid invitation link")
      setIsLoading(false)
    }
  }, [token])

  const loadInvitation = async (invitationToken: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('token', invitationToken)
        .single()

      if (error) throw error

      if (!data) {
        throw new Error("Invitation not found")
      }

      if (data.accepted_at) {
        throw new Error("This invitation has already been accepted")
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error("This invitation has expired")
      }

      setInvitation(data)
      setEmail(data.email)
    } catch (error) {
      console.error('Error loading invitation:', error)
      setError(error instanceof Error ? error.message : "Invalid invitation")
    } finally {
      setIsLoading(false)
    }
  }

  const acceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitation) return

    setIsAccepting(true)
    setError(null)

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase.auth.getUser()
      
      let userId = existingUser.user?.id

      if (!userId) {
        // Create new user account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: invitation.role,
            },
          },
        })

        if (signUpError) throw signUpError
        if (!signUpData.user) throw new Error("Failed to create user")

        userId = signUpData.user.id
      }

      // Create or update profile with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          first_name: firstName,
          last_name: lastName,
          role: invitation.role,
          organization_id: invitation.organization_id
        })

      if (profileError) throw profileError

      // Mark invitation as accepted
      const { error: acceptError } = await supabase
        .from('invitations')
        .update({
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (acceptError) throw acceptError

      setSuccess(true)
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError(error instanceof Error ? error.message : "Failed to accept invitation")
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/auth/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Invitation Accepted!</CardTitle>
            <CardDescription>
              Welcome to {invitation?.organization?.name}. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join {invitation?.organization?.name}</CardTitle>
            <CardDescription>
              You've been invited to join as a {invitation?.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={acceptInvitation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
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
                  <Label htmlFor="lastName">Last name</Label>
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
              
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isAccepting} className="w-full">
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <InvitationContent />
    </Suspense>
  )
}