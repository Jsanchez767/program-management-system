import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Bell, FileText, AlertTriangle, Calendar, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

// Mock data for demo
const mockProfile = {
  first_name: "Alex",
  last_name: "Chen",
}

const mockStats = {
  enrolledActivities: 2,
  pendingDocuments: 1,
  unreadAnnouncements: 3,
  missingDocuments: 2,
}

const mockActivities = [
  {
    activity: {
      id: 1,
      name: "Summer STEM Camp",
      description:
        "Explore science, technology, engineering, and mathematics through hands-on activities and experiments.",
      status: "active",
      start_date: "2024-01-15",
      end_date: "2024-03-15",
    },
  },
  {
    activity: {
      id: 2,
      name: "Creative Writing Workshop",
      description: "Develop your writing skills through creative exercises, peer review, and professional guidance.",
      status: "active",
      start_date: "2024-01-10",
      end_date: "2024-02-28",
    },
  },
]

const mockAnnouncements = [
  {
    id: 1,
    title: "Field Trip to Science Museum",
    content:
      "Join us for an exciting field trip to the local science museum next Friday. Permission slips are required.",
    priority: "high",
    published_at: "2024-01-18",
    activity: { name: "Summer STEM Camp" },
  },
  {
    id: 2,
    title: "Writing Contest Submission Deadline",
    content: "Don't forget to submit your creative writing pieces for our annual contest by January 25th.",
    priority: "medium",
    published_at: "2024-01-17",
    activity: { name: "Creative Writing Workshop" },
  },
  {
    id: 3,
    title: "Program Schedule Update",
    content: "Please note that next week's sessions will start 30 minutes later due to facility maintenance.",
    priority: "urgent",
    published_at: "2024-01-16",
    activity: null,
  },
]

const mockMissingDocuments = [
  { id: 1, name: "Medical Form", document_type: "medical_form", status: "missing", created_at: "2024-01-10" },
  { id: 2, name: "Emergency Contact", document_type: "emergency_contact", status: "missing", created_at: "2024-01-12" },
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    case "medium":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }
}

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {mockProfile.first_name}!</h1>
            <p className="text-muted-foreground mt-2">Here's your program overview and important updates.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Enrolled Activities"
              value={mockStats.enrolledActivities}
              description="Active enrollments"
              icon={BookOpen}
            />
            <StatsCard
              title="New Announcements"
              value={mockStats.unreadAnnouncements}
              description="Unread messages"
              icon={Bell}
            />
            <StatsCard
              title="Pending Documents"
              value={mockStats.pendingDocuments}
              description="Under review"
              icon={FileText}
            />
            <StatsCard
              title="Missing Documents"
              value={mockStats.missingDocuments}
              description="Action required"
              icon={AlertTriangle}
            />
          </div>

          {/* Missing Documents Alert */}
          {mockMissingDocuments.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800 dark:text-red-200">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Missing Documents - Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-red-700 dark:text-red-300 mb-4">
                  <p>You have {mockMissingDocuments.length} missing documents that need to be submitted:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {mockMissingDocuments.slice(0, 3).map((doc) => (
                      <li key={doc.id}>
                        {doc.name} ({doc.document_type.replace("_", " ")})
                      </li>
                    ))}
                  </ul>
                </div>
                <Button asChild variant="destructive">
                  <Link href="/student/documents">Submit Missing Documents</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* My Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  My Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockActivities.map((enrollment, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{enrollment.activity.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {enrollment.activity.description}
                          </p>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(enrollment.activity.start_date).toLocaleDateString()}
                            {enrollment.activity.end_date &&
                              ` - ${new Date(enrollment.activity.end_date).toLocaleDateString()}`}
                          </div>
                        </div>
                        <Badge
                          className={
                            enrollment.activity.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }
                        >
                          {enrollment.activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/participant/activities">View All Programs</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{announcement.title}</h4>
                        <Badge className={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{announcement.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground">
                          {new Date(announcement.published_at).toLocaleDateString()}
                        </p>
                        {announcement.activity && (
                          <p className="text-xs text-muted-foreground">{announcement.activity?.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/student/announcements">View All Announcements</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                  <Link href="/student/documents" className="flex flex-col items-center space-y-2">
                    <FileText className="h-6 w-6" />
                    <span>Submit Documents</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                  <Link href="/student/announcements" className="flex flex-col items-center space-y-2">
                    <Bell className="h-6 w-6" />
                    <span>View Announcements</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                  <Link href="/student/profile" className="flex flex-col items-center space-y-2">
                    <Clock className="h-6 w-6" />
                    <span>Update Profile</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
  )
}
