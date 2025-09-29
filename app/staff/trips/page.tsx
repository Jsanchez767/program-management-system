"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Calendar, MapPin, Users, Plus, UserPlus, UserMinus, MessageSquare } from "lucide-react"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

interface Trip {
  id: string
  name: string
  description: string
  destination: string
  start_date: string
  end_date: string
  max_participants: number
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  admin_comments: string
  organization_id: string
  created_at: string
}

interface Chaperone {
  id: string
  trip_id: string
  staff_id: string
  organization_id: string
  created_at: string
  staff_name?: string
  staff_email?: string
}

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
}

export default function StaffTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [chaperones, setChaperones] = useState<Chaperone[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTripForChaperone, setSelectedTripForChaperone] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchTrips()
    fetchChaperones()
    fetchStaffMembers()
  }, [])

  async function fetchTrips() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) {
        console.log("No organization ID found")
        return
      }

      // For staff, only show active and completed trips
      const { data: tripsData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('organization_id', user.user_metadata.organization_id)
        .in('status', ['active', 'completed'])
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching trips:', error)
        return
      }

      setTrips(tripsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChaperones() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) return

      const { data: chaperonesData, error } = await supabase
        .from('chaperones')
        .select(`
          *,
          profiles:staff_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', user.user_metadata.organization_id)

      if (error) {
        console.error('Error fetching chaperones:', error)
        return
      }

      const chaperonesWithNames = chaperonesData?.map(chaperone => ({
        ...chaperone,
        staff_name: chaperone.profiles ? 
          `${chaperone.profiles.first_name || ''} ${chaperone.profiles.last_name || ''}`.trim() : 
          'Unknown Staff',
        staff_email: chaperone.profiles?.email || ''
      })) || []

      setChaperones(chaperonesWithNames)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function fetchStaffMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) return

      // Get staff members from profiles table
      const { data: staffData, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('organization_id', user.user_metadata.organization_id)
        .in('role', ['staff', 'instructor'])

      if (error) {
        console.error('Error fetching staff:', error)
        return
      }

      setStaffMembers(staffData || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function addChaperone(tripId: string, staffId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) return

      const { error } = await supabase
        .from('chaperones')
        .insert({
          trip_id: tripId,
          staff_id: staffId,
          organization_id: user.user_metadata.organization_id
        })

      if (error) {
        console.error('Error adding chaperone:', error)
        return
      }

      await fetchChaperones()
      setSelectedTripForChaperone(null)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function removeChaperone(chaperoneId: string) {
    if (!confirm('Are you sure you want to remove this chaperone?')) return

    try {
      const { error } = await supabase
        .from('chaperones')
        .delete()
        .eq('id', chaperoneId)

      if (error) {
        console.error('Error removing chaperone:', error)
        return
      }

      await fetchChaperones()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getChaperones(tripId: string) {
    return chaperones.filter(c => c.trip_id === tripId)
  }

  function getAvailableStaff(tripId: string) {
    const tripChaperones = getChaperones(tripId)
    const assignedStaffIds = tripChaperones.map(c => c.staff_id)
    return staffMembers.filter(staff => !assignedStaffIds.includes(staff.id))
  }

  function isUserChaperone(tripId: string, userId: string) {
    return chaperones.some(c => c.trip_id === tripId && c.staff_id === userId)
  }

  if (loading) {
    return (
      <main className="p-6 lg:p-8 pt-20 lg:pt-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Trips</h1>
            <p className="text-muted-foreground">View and manage your assigned trips</p>
          </div>
          
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 lg:p-8 pt-20 lg:pt-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">View and manage your assigned trips and chaperone duties</p>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {trips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active trips</h3>
                <p className="text-muted-foreground">
                  There are currently no active trips. Check back later or contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            trips.map((trip) => {
              const tripChaperones = getChaperones(trip.id)
              const availableStaff = getAvailableStaff(trip.id)
              
              return (
                <Card key={trip.id}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">{trip.name}</h3>
                            <Badge className={getStatusColor(trip.status)}>
                              {trip.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{trip.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(trip.start_date), 'MMM d')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>0/{trip.max_participants} participants</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{trip.description}</p>
                        </div>
                      </div>
                      
                      {/* Chaperones Section */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium">Chaperones ({tripChaperones.length})</h4>
                          
                          {trip.status === 'active' && availableStaff.length > 0 && (
                            <Dialog 
                              open={selectedTripForChaperone === trip.id} 
                              onOpenChange={(open) => setSelectedTripForChaperone(open ? trip.id : null)}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Add Chaperone
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Chaperone to {trip.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Select a staff member to add as a chaperone for this trip.
                                  </p>
                                  <div className="space-y-2">
                                    {availableStaff.map((staff) => (
                                      <Button
                                        key={staff.id}
                                        variant="outline"
                                        className="w-full justify-start"
                                        onClick={() => addChaperone(trip.id, staff.id)}
                                      >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {staff.first_name} {staff.last_name}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          ({staff.email})
                                        </span>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {tripChaperones.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No chaperones assigned yet</p>
                          ) : (
                            tripChaperones.map((chaperone) => (
                              <div key={chaperone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="font-medium">{chaperone.staff_name}</p>
                                  <p className="text-sm text-muted-foreground">{chaperone.staff_email}</p>
                                </div>
                                
                                {trip.status === 'active' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeChaperone(chaperone.id)}
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Comments */}
                      {trip.admin_comments && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Admin Comments</p>
                              <p className="text-sm text-blue-700">{trip.admin_comments}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}