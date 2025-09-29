"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { FieldTrip } from "@/lib/types/database"
import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminFieldTripsPage() {
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFieldTrips() {
      try {
        const supabase = createClient()
        
        // Get current user and their organization from metadata
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get organization_id from user metadata
        const organizationId = user.user_metadata?.organization_id
        if (!organizationId) return

        // Fetch field trips for this organization
        const { data: fieldTripsData } = await supabase
          .from('field_trips')
          .select('*')
          .eq('organization_id', organizationId)
          .order('trip_date', { ascending: true })

        setFieldTrips(fieldTripsData || [])
      } catch (error) {
        console.error('Error fetching field trips:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFieldTrips()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <main className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Field Trips</h1>
            <p className="text-muted-foreground">
              Review and manage field trip proposals from staffs
            </p>
          </div>
        </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fieldTrips.length > 0 ? (
              fieldTrips.map((trip: any) => (
                <Card key={trip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <Badge className={getStatusColor(trip.status)}>
                        {trip.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {trip.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📍</span>
                        {trip.destination}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        {new Date(trip.trip_date).toLocaleDateString()}
                      </div>

                      {trip.cost_per_student && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">💰</span>
                          ${trip.cost_per_student} per student
                        </div>
                      )}

                      {trip.max_participants && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">👥</span>
                          Max {trip.max_participants} participants
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      {trip.status === 'submitted' && (
                        <>
                          <Button size="sm" className="flex-1">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No field trips found</p>
                <p className="text-sm text-muted-foreground">
                  Field trip proposals from staffs will appear here
                </p>
              </div>
            )}
            </div>
          </div>
    </main>
  )
}