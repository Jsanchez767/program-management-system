import { InstructorSidebar } from "@/shared/components/layout/InstructorSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import Link from "next/link"

const mockFieldTrips = [
  {
    id: "1",
    title: "Science Museum Visit",
    description: "Educational visit to explore interactive science exhibits",
    status: "approved",
    program: { name: "Science Laboratory" },
    destination: "City Science Museum",
    trip_date: "2024-02-15",
    cost_per_student: "25.00",
    max_participants: 30,
    approved_at: "2024-01-20T10:00:00Z",
    approver: { first_name: "Dr. Sarah", last_name: "Johnson" },
  },
  {
    id: "2",
    title: "Art Gallery Tour",
    description: "Guided tour of contemporary art exhibitions",
    status: "submitted",
    program: { name: "Creative Arts" },
    destination: "Metropolitan Art Gallery",
    trip_date: "2024-02-22",
    cost_per_student: "15.00",
    max_participants: 25,
  },
]

export default function InstructorFieldTripsPage() {
  const fieldTrips = mockFieldTrips

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "scheduled":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <InstructorSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Field Trips</h1>
              <p className="text-muted-foreground mt-2">Request and manage educational field trips</p>
            </div>
            <Button asChild>
              <Link href="/instructor/field-trips/new">
                <span className="mr-2">➕</span>
                New Field Trip Request
              </Link>
            </Button>
          </div>

          {/* Field Trips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fieldTrips && fieldTrips.length > 0 ? (
              fieldTrips.map((trip) => (
                <Card key={trip.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <Badge className={getStatusColor(trip.status)}>{trip.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {trip.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📚</span>
                        {trip.program?.name || "No program assigned"}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">🗺️</span>
                        {trip.destination}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        {new Date(trip.trip_date).toLocaleDateString()}
                      </div>

                      {trip.cost_per_student && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">💰</span>${Number.parseFloat(trip.cost_per_student).toFixed(2)} per
                          student
                        </div>
                      )}

                      {trip.max_participants && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">👥</span>
                          Max {trip.max_participants} participants
                        </div>
                      )}

                      {trip.approved_at && trip.approver && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Approved by {trip.approver.first_name} {trip.approver.last_name}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/instructor/field-trips/${trip.id}`}>View Details</Link>
                      </Button>
                      {trip.status === "draft" && (
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                          <Link href={`/instructor/field-trips/${trip.id}/edit`}>Edit</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <span className="text-4xl mb-4 block">🗺️</span>
                      <h3 className="text-lg font-medium text-foreground mb-2">No field trips yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Request your first field trip to enhance your students' learning experience.
                      </p>
                      <Button asChild>
                        <Link href="/instructor/field-trips/new">
                          <span className="mr-2">➕</span>
                          Request Field Trip
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
