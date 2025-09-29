import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const mockAnnouncements = [
  {
    id: "1",
    title: "Welcome to the New Semester!",
    content:
      "We're excited to start this new semester with you. Please review your program schedules and make sure you have all required materials.",
    priority: "high",
    published_at: "2024-01-15T10:00:00Z",
    author: { first_name: "Dr. Sarah", last_name: "Johnson" },
    activity: { name: "Advanced Mathematics" },
    expires_at: "2024-02-15T23:59:59Z",
  },
  {
    id: "2",
    title: "Lab Safety Reminder",
    content:
      "Please remember to bring your safety goggles and lab coats to all laboratory sessions. Safety is our top priority.",
    priority: "urgent",
    published_at: "2024-01-18T14:30:00Z",
    author: { first_name: "Prof. Michael", last_name: "Chen" },
    activity: { name: "Science Laboratory" },
  },
  {
    id: "3",
    title: "Field Trip Permission Forms Due",
    content: "Don't forget to submit your signed permission forms for the upcoming museum visit by Friday.",
    priority: "medium",
    published_at: "2024-01-20T09:15:00Z",
    author: { first_name: "Ms. Emily", last_name: "Rodriguez" },
  },
]

export default function StudentAnnouncementsPage() {
  const announcements = mockAnnouncements

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

  return (
    <div className="min-h-screen bg-background">
      <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
            <p className="text-muted-foreground mt-2">Stay updated with important news and information</p>
          </div>

          {/* Announcements List */}
          <div className="space-y-6">
            {announcements && announcements.length > 0 ? (
              announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <span className="mr-1">📅</span>
                            {new Date(announcement.published_at).toLocaleDateString()}
                          </div>
                          {announcement.author && (
                            <div>
                              By {announcement.author.first_name} {announcement.author.last_name}
                            </div>
                          )}
                          {announcement.activity && (
                            <div className="flex items-center">
                              <span className="mr-1">📚</span>
                              {announcement.activity.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={getPriorityColor(announcement.priority)}>{announcement.priority}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none text-foreground">
                      <p className="whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                    {announcement.expires_at && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Expires:</strong> {new Date(announcement.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📢</span>
                    <h3 className="text-lg font-medium text-foreground mb-2">No announcements</h3>
                    <p className="text-muted-foreground">
                      There are no announcements available at this time. Check back later for updates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
  )
}
