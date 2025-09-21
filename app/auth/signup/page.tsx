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
  const [role, setRole] = useState("student")
  const [organizationName, setOrganizationName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Validate organization name for admins
      if (role === 'admin' && !organizationName.trim()) {
        throw new Error('Organization name is required for admin accounts')
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        },
      })
      
      if (error) throw error

      // For development/testing - create profile and organization immediately if email confirmation is disabled
      if (data.user?.id) {
        try {
          console.log('Creating organization and profile for user:', data.user.id)
          
          let organizationId = null
          
          // Create organization if user is admin
          if (role === 'admin') {
            console.log('Attempting to create organization:', organizationName)
            const subdomain = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            console.log('Generated subdomain:', subdomain)
            
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .insert({
                name: organizationName,
                subdomain: subdomain,
                admin_id: data.user.id
              })
              .select()
              .single()
            
            if (orgError) {
              console.error('Organization creation error:', orgError)
              console.error('Error code:', orgError.code)
              console.error('Error message:', orgError.message)
              console.error('Error details:', orgError.details)
              throw new Error(`Failed to create organization: ${orgError.message}`)
            } else {
              console.log('Organization created successfully:', orgData)
              organizationId = orgData.id
            }
          }
          
          // Create profile
          console.log('Attempting to create profile for user:', data.user.id)
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            role: role,
            organization_id: organizationId
          })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            console.error('Profile error code:', profileError.code)
            console.error('Profile error message:', profileError.message)
            console.error('Profile error details:', profileError.details)
            throw new Error(`Failed to create user profile: ${profileError.message}`)
          } else {
            console.log('Profile created successfully')
          }
        } catch (profileError) {
          console.log('Profile/Organization creation failed:', profileError)
          throw profileError
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
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
                    type="text"
                    placeholder="Your Organization Name"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
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
                  type="password"
                  placeholder="Create a strong password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
