import { StaffSidebar } from "@/shared/components/layout/StaffSidebar"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { BookOpen, Calendar, ShoppingCart, MapPin, Plus, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

// Mock data for demo
const mockProfile = {
  first_name: "Sarah",
  last_name: "Johnson",
}

const mockStats = {
  myActivities: 3,
  totalLessonPlans: 15,
  pendingPOs: 2,
  approvedFieldTrips: 1,
}

const mockUpcomingLessons = [
  { title: "Introduction to Algebra", activity: { name: "Math Fundamentals" }, lesson_date: "2024-01-22" },
  { title: "Creative Writing Workshop", activity: { name: "English Literature" }, lesson_date: "2024-01-24" },
  { title: "Science Lab: Chemistry", activity: { name: "STEM Basics" }, lesson_date: "2024-01-26" },
]

const mockRecentLessonPlans = [
  { title: "Geometry Basics", status: "published", created_at: "2024-01-15" },
  { title: "Poetry Analysis", status: "draft", created_at: "2024-01-14" },
  { title: "Physics Experiments", status: "review", created_at: "2024-01-12" },
  { title: "History Timeline", status: "published", created_at: "2024-01-10" },
  { title: "Art Techniques", status: "draft", created_at: "2024-01-08" },
]

export default function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <StaffSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {mockProfile.first_name}!</h1>
            <p className="text-muted-foreground mt-2">Here's an overview of your activities and activities.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="My Activities"
              value={mockStats.myActivities}
              description="Activities you're teaching"
              icon={BookOpen}
            />
            <StatsCard
              title="Lesson Plans"
              value={mockStats.totalLessonPlans}
              description="Total created"
              icon={Calendar}
            />
            <StatsCard
              title="Pending Orders"
              value={mockStats.pendingPOs}
              description="Awaiting approval"
              icon={ShoppingCart}
            />
            <StatsCard
              title="Approved Trips"
              value={mockStats.approvedFieldTrips}
              description="Ready to schedule"
              icon={MapPin}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/staff/lesson-plans/new">
                    <Calendar className="mr-2 h-4 w-4" />
                    Create Lesson Plan
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/staff/purchase-orders/new">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Submit Purchase Order
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start bg-transparent" variant="outline">
                  <Link href="/staff/field-trips/new">
                    <MapPin className="mr-2 h-4 w-4" />
                    Request Field Trip
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Upcoming Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockUpcomingLessons.map((lesson, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <h4 className="font-medium text-sm">{lesson.title}</h4>
                      <p className="text-xs text-muted-foreground">{lesson.activity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(lesson.lesson_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Lesson Plans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Recent Lesson Plans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockRecentLessonPlans.map((plan, index) => (
                    <div key={index} className="p-3 border border-border rounded-lg">
                      <h4 className="font-medium text-sm">{plan.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                        <div
                          className={`px-2 py-1 rounded-full text-xs ${
                            plan.status === "published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : plan.status === "draft"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {plan.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
