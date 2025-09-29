"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [role, setRole] = useState("participant")
  const [organizationName, setOrganizationName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Get the actual form element
    const form = e.target as HTMLFormElement
    
    // Get all input values directly from the DOM to handle autofill and browser quirks
    const emailInput = form.querySelector('#email') as HTMLInputElement
    const passwordInput = form.querySelector('#password') as HTMLInputElement
    const firstNameInput = form.querySelector('#firstName') as HTMLInputElement
    const lastNameInput = form.querySelector('#lastName') as HTMLInputElement
    const organizationNameInput = form.querySelector('#organizationName') as HTMLInputElement

    // Get actual values from inputs
    const actualEmail = emailInput?.value || ''
    const actualPassword = passwordInput?.value || ''
    const actualFirstName = firstNameInput?.value || ''
    const actualLastName = lastNameInput?.value || ''
    const actualOrganizationName = organizationNameInput?.value || ''

    // Get form data directly from the form to handle autofill
    const formData = new FormData(form)
    const formEmail = formData.get('email') as string
    const formPassword = formData.get('password') as string
    const formFirstName = formData.get('firstName') as string
    const formLastName = formData.get('lastName') as string
    const formOrganizationName = formData.get('organizationName') as string
    const formRole = formData.get('role') as string

    // Debug: log all form data
    console.log('Raw FormData entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${key === 'password' ? '***' : value}`)
    }

    // Use the most reliable source for each field
    const finalEmail = actualEmail || email || formEmail
    const finalPassword = actualPassword || password || formPassword
    const finalFirstName = actualFirstName || firstName || formFirstName
    const finalLastName = actualLastName || lastName || formLastName
    const finalOrganizationName = actualOrganizationName || organizationName || formOrganizationName
    const finalRole = role // Always use state for role since Select doesn't work with FormData

    try {
      // Validate organization name for admins
      if (finalRole === 'admin' && !finalOrganizationName.trim()) {
        throw new Error('Organization name is required for admin accounts')
      }

      console.log('Starting signup process...', { 
        finalValues: {
          email: finalEmail, 
          role: finalRole, 
          firstName: finalFirstName, 
          lastName: finalLastName, 
          organizationName: finalOrganizationName,
          password: finalPassword ? '***' : 'EMPTY'
        },
        stateValues: {
          email, 
          role, 
          firstName, 
          lastName, 
          organizationName,
          password: password ? '***' : 'EMPTY'
        },
        actualDOMValues: {
          email: actualEmail,
          password: actualPassword ? '***' : 'EMPTY',
          firstName: actualFirstName,
          lastName: actualLastName,
          organizationName: actualOrganizationName
        },
        formDataValues: {
          email: formEmail,
          password: formPassword ? '***' : 'EMPTY',
          firstName: formFirstName,
          lastName: formLastName,
          organizationName: formOrganizationName,
          role: formRole
        }
      })

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: finalPassword,
        options: {
          data: {
            first_name: finalFirstName,
            last_name: finalLastName,
            role: finalRole,
            organization_name: finalRole === 'admin' ? finalOrganizationName : null
          }
        }
      })
      
      console.log('Signup response:', { data, error })
      
      if (error) {
        console.error('Signup error:', error)
        if (error.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        }
        throw new Error(`Signup failed: ${error.message}`)
      }

      if (!data.user) {
        throw new Error('User creation failed - no user data returned')
      }

      // For admin users, create organization and update user metadata with organization_id
      if (data.user?.id && role === 'admin') {
        try {
          console.log('Creating organization for admin user:', data.user.id)
          
          // Use the secure database function to create organization
          const { data: orgData, error: orgError } = await supabase
            .rpc('create_organization_for_signup', {
              org_name: finalOrganizationName,
              admin_user_id: data.user.id
            })
          
          console.log('Organization creation response:', { orgData, orgError })
          
          if (orgError) {
            console.error('Organization creation error:', orgError)
            throw new Error(`Failed to create organization: ${orgError.message}`)
          }
          
          if (!orgData || orgData.length === 0) {
            throw new Error('Organization creation failed - no data returned')
          }
          
          const organizationId = orgData[0].organization_id
          console.log('Organization created successfully with ID:', organizationId)
          
          // Update user metadata with organization_id
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              first_name: finalFirstName,
              last_name: finalLastName,
              role: finalRole,
              organization_id: organizationId,
              organization_name: finalOrganizationName
            }
          })
          
          console.log('User metadata update response:', { updateError })
          
          if (updateError) {
            console.error('Failed to update user metadata:', updateError)
            throw new Error(`Failed to link user to organization: ${updateError.message}`)
          }
          
          console.log('✅ Admin account setup completed with organization link')
        } catch (organizationError) {
          console.log('Organization setup failed:', organizationError)
          throw organizationError
        }
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        router.push("/auth/verify-email")
      } else {
        // If no email confirmation needed, go directly to dashboard
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Card className="border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">Create your account</CardTitle>
            <CardDescription className="text-muted-foreground">Join the program management system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Hidden input for role to ensure FormData captures it */}
              <input type="hidden" name="role" value={role} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className="h-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole} name="role">
                  <SelectTrigger id="role" className="h-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="participant">Student</SelectItem>
                    <SelectItem value="staff">Instructor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-sm font-medium">
                    Organization Name
                  </Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    placeholder="Your Organization Name"
                    required={role === 'admin'}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    autoComplete="organization"
                    className="h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be your workspace name that others can join
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-10"
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
