"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/database"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const supabase = createClient()
      
      try {
        // Check if user is authenticated
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          router.push("/auth/login")
          return
        }

        // Get user profile to determine role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          // If no profile exists, redirect to signup to complete profile
          router.push("/auth/signup")
          return
        }

        // Redirect based on user role
        switch (profile.role) {
          case 'admin':
            router.push("/admin")
            break
          case 'instructor':
            router.push("/instructor")
            break
          case 'student':
            router.push("/student")
            break
          default:
            router.push("/auth/login")
        }
      } catch (error) {
        console.error('Error checking user:', error)
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndRedirect()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}