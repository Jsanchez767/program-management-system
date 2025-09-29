"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Calendar, MapPin, Users, Plus, Edit, Trash2, MessageSquare } from "lucide-react"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

interface Trip {
  id: string
  activity_id?: string
  location: string
  trip_date: string
  return_date: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  organization_id: string
  created_at: string
  updated_at: string
  custom_fields?: any
  comments?: string
  pickup_time?: string
  Return_time?: string
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

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [chaperones, setChaperones] = useState<Chaperone[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTrip, setIsAddingTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [newTrip, setNewTrip] = useState({
    location: '',
    trip_date: '',
    return_date: '',
    pickup_time: '',
    Return_time: '',
    comments: '',
    custom_fields: {}
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchTrips()
    fetchChaperones()
  }, [])

  async function fetchTrips() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) {
        console.log("No organization ID found")
        return
      }

      const { data: tripsData, error } = await supabase
        .from('trips')
        .select('*')
        .eq('organization_id', user.user_metadata.organization_id)
        .order('created_at', { ascending: false })

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

  async function createTrip() {
    try {
      console.log('Creating trip with data:', newTrip)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) {
        console.error('No organization ID found')
        return
      }

      const tripData = {
        location: newTrip.location,
        trip_date: newTrip.trip_date,
        return_date: newTrip.return_date,
        pickup_time: newTrip.pickup_time || null,
        Return_time: newTrip.Return_time || null,
        comments: newTrip.comments || null,
        status: 'draft',
        organization_id: user.user_metadata.organization_id,
        custom_fields: newTrip.custom_fields || {}
      }

      console.log('Sending trip data to Supabase:', tripData)

      const { data, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select()
        .single()

      if (error) {
        console.error('Error creating trip:', error)
        alert('Error creating trip: ' + error.message)
        return
      }

      console.log('Trip created successfully:', data)
      await fetchTrips()
      setIsAddingTrip(false)
      setNewTrip({
        location: '',
        trip_date: '',
        return_date: '',
        pickup_time: '',
        Return_time: '',
        comments: '',
        custom_fields: {}
      })
    } catch (error) {
      console.error('Error:', error)
      alert('Unexpected error: ' + error)
    }
  }

  async function updateTripStatus(tripId: string, status: Trip['status'], comments?: string) {
    try {
      const updateData: any = { status }
      if (comments !== undefined) {
        updateData.comments = comments
      }

      const { error } = await supabase
        .from('trips')
        .update(updateData)
        .eq('id', tripId)

      if (error) {
        console.error('Error updating trip:', error)
        return
      }

      await fetchTrips()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function deleteTrip(tripId: string) {
    if (!confirm('Are you sure you want to delete this trip?')) return

    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (error) {
        console.error('Error deleting trip:', error)
        return
      }

      await fetchTrips()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getChaperones(tripId: string) {
    return chaperones.filter(c => c.trip_id === tripId)
  }

  if (loading) {
    return (
      <main className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Trip Management</h1>
            <p className="text-muted-foreground">Manage field trips and educational outings</p>
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
    <main className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trip Management</h1>
            <p className="text-muted-foreground">Manage field trips and educational outings</p>
          </div>
          
          <Dialog open={isAddingTrip} onOpenChange={setIsAddingTrip}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Trip</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTrip.location}
                      onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
                      placeholder="Science Museum"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trip_date">Trip Date</Label>
                    <Input
                      id="trip_date"
                      type="date"
                      value={newTrip.trip_date}
                      onChange={(e) => setNewTrip({ ...newTrip, trip_date: e.target.value })}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    value={newTrip.comments}
                    onChange={(e) => setNewTrip({ ...newTrip, comments: e.target.value })}
                    placeholder="Trip details and notes..."
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="return_date">Return Date</Label>
                    <Input
                      id="return_date"
                      type="date"
                      value={newTrip.return_date}
                      onChange={(e) => setNewTrip({ ...newTrip, return_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_time">Pickup Time</Label>
                    <Input
                      id="pickup_time"
                      type="time"
                      value={newTrip.pickup_time}
                      onChange={(e) => setNewTrip({ ...newTrip, pickup_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="Return_time">Return Time</Label>
                    <Input
                      id="Return_time"
                      type="time"
                      value={newTrip.Return_time}
                      onChange={(e) => setNewTrip({ ...newTrip, Return_time: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={createTrip} className="flex-1">
                    Create Trip
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingTrip(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Trips List */}
        <div className="space-y-4">
          {trips.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first trip to start managing field trips and educational outings.
                </p>
                <Button onClick={() => setIsAddingTrip(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            trips.map((trip) => (
              <Card key={trip.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{trip.location}</h3>
                          <Badge className={getStatusColor(trip.status)}>
                            {trip.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{trip.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(trip.trip_date), 'MMM d, yyyy')}
                              {trip.return_date && trip.return_date !== trip.trip_date && 
                                ` - ${format(new Date(trip.return_date), 'MMM d, yyyy')}`
                              }
                            </span>
                          </div>
                          {(trip.pickup_time || trip.Return_time) && (
                            <div className="flex items-center gap-1">
                              <span>⏰</span>
                              <span>
                                {trip.pickup_time && `Pickup: ${trip.pickup_time}`}
                                {trip.pickup_time && trip.Return_time && ' | '}
                                {trip.Return_time && `Return: ${trip.Return_time}`}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {trip.comments && (
                          <p className="text-sm text-muted-foreground">{trip.comments}</p>
                        )}                      {/* Chaperones */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Chaperones ({getChaperones(trip.id).length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {getChaperones(trip.id).map((chaperone) => (
                            <Badge key={chaperone.id} variant="outline">
                              {chaperone.staff_name}
                            </Badge>
                          ))}
                          {getChaperones(trip.id).length === 0 && (
                            <span className="text-sm text-muted-foreground">No chaperones assigned</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Comments */}

                    </div>
                    
                    <div className="ml-6 space-y-2">
                      <Select
                        value={trip.status}
                        onValueChange={(value) => updateTripStatus(trip.id, value as Trip['status'])}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteTrip(trip.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  )
}