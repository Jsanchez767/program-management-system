"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MapPin, Users, Plus, Edit, Trash2, MessageSquare } from "lucide-react"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'

interface Program {
  id: string
  name: string
  description: string
  category: string
  status: string
}

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
  activity_id: string
  created_at: string
  updated_at: string
  activities?: {
    id: string
    name: string
    category: string
  }
}

interface Chaperone {
  id: string
  trip_id: string
  organization_id: string
  staff_id?: string | null
  name?: string | null
  email?: string | null
  phone?: string | null
  role?: string
  notes?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  created_at: string
  updated_at: string
  staff_name?: string
  staff_email?: string
}

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [chaperones, setChaperones] = useState<Chaperone[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTrip, setIsAddingTrip] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [newTrip, setNewTrip] = useState({
    name: '',
    description: '',
    destination: '',
    start_date: '',
    end_date: '',
    max_participants: 0,
    activity_id: '',
    pickup_time: '',
    return_time: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchTrips()
    fetchPrograms()
    fetchChaperones()

    // Set up real-time subscription for trips
    const channel = supabase
      .channel('trips_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        () => {
          fetchTrips()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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
        .select(`
          *,
          activities (
            id,
            name,
            category
          )
        `)
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

  async function fetchPrograms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) return

      const { data: programsData, error } = await supabase
        .from('activities')
        .select('id, name, description, category, status')
        .eq('organization_id', user.user_metadata.organization_id)
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching programs:', error)
        return
      }

      setPrograms(programsData || [])
    } catch (error) {
      console.error('Error:', error)
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
            email,
            phone
          )
        `)
        .eq('organization_id', user.user_metadata.organization_id)

      if (error) {
        console.error('Error fetching chaperones:', error)
        return
      }

      const chaperonesWithNames = chaperonesData?.map(chaperone => ({
        ...chaperone,
        staff_name: chaperone.staff_id && chaperone.profiles ? 
          `${chaperone.profiles.first_name || ''} ${chaperone.profiles.last_name || ''}`.trim() : 
          chaperone.name || 'Unknown',
        staff_email: chaperone.staff_id && chaperone.profiles ? 
          chaperone.profiles.email || '' : 
          chaperone.email || ''
      })) || []

      setChaperones(chaperonesWithNames)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function createTrip() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.user_metadata?.organization_id) return

      if (!newTrip.activity_id) {
        alert('Please select a program for this trip')
        return
      }

      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...newTrip,
          organization_id: user.user_metadata.organization_id,
          status: 'draft',
          admin_comments: ''
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating trip:', error)
        return
      }

      await fetchTrips()
      setIsAddingTrip(false)
      setNewTrip({
        name: '',
        description: '',
        destination: '',
        start_date: '',
        end_date: '',
        max_participants: 0,
        activity_id: '',
        pickup_time: '',
        return_time: ''
      })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  async function updateTripStatus(tripId: string, status: Trip['status'], comments?: string) {
    try {
      const updateData: any = { status }
      if (comments !== undefined) {
        updateData.admin_comments = comments
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
                <div>
                  <Label htmlFor="program">Program</Label>
                  <Select value={newTrip.activity_id} onValueChange={(value) => setNewTrip({ ...newTrip, activity_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          <div className="flex items-center gap-2">
                            <span>{program.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {program.category}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Trip Name</Label>
                    <Input
                      id="name"
                      value={newTrip.name}
                      onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
                      placeholder="Museum Field Trip"
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                      placeholder="Science Museum"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                    placeholder="Educational trip to explore..."
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newTrip.start_date}
                      onChange={(e) => setNewTrip({ ...newTrip, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newTrip.end_date}
                      onChange={(e) => setNewTrip({ ...newTrip, end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_participants">Max Participants</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={newTrip.max_participants}
                      onChange={(e) => setNewTrip({ ...newTrip, max_participants: parseInt(e.target.value) || 0 })}
                      placeholder="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup_time">Pickup Time</Label>
                    <Input
                      id="pickup_time"
                      type="time"
                      value={newTrip.pickup_time}
                      onChange={(e) => setNewTrip({ ...newTrip, pickup_time: e.target.value })}
                      placeholder="08:00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="return_time">Return Time</Label>
                    <Input
                      id="return_time"
                      type="time"
                      value={newTrip.return_time}
                      onChange={(e) => setNewTrip({ ...newTrip, return_time: e.target.value })}
                      placeholder="15:00"
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
                        <h3 className="text-xl font-semibold">{trip.name}</h3>
                        <Badge className={getStatusColor(trip.status)}>
                          {trip.status}
                        </Badge>
                        {trip.activities && (
                          <Badge variant="secondary">
                            {trip.activities.name}
                          </Badge>
                        )}
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
                      
                      {/* Chaperones */}
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