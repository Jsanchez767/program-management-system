import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

async function getParticipants() {
  const supabase = await createClient()
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Try to get organization_id from user metadata
  let organizationId = user.user_metadata?.organization_id

  // Fallback: fetch organization_id from organizations table using user id
  if (!organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single()
    organizationId = org?.id
  }
  if (!organizationId) return []

  // Fetch participants for this organization
  const { data: participants } = await supabase
    .from('program_participants')
    .select('id, enrollment_date, status, student_id, program_id, programs(id, name), student_email, student_first_name, student_last_name')
    .eq('organization_id', organizationId)
    .order('enrollment_date', { ascending: false })

  return participants || []
}

export default async function AdminParticipantsPage() {
  const participants = await getParticipants()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enrolled":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "dropped":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8 pt-20 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Program Participants</h1>
                <p className="text-muted-foreground">
                  Manage student enrollments and participation status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {participants.length > 0 ? (
              participants.map((participant) => (
                <Card key={participant.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {participant.student_first_name} {participant.student_last_name}
                      </CardTitle>
                      <Badge className={getStatusColor(participant.status)}>
                        {participant.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📚</span>
                        {participant.programs?.[0]?.name}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📧</span>
                        {participant.student_email}
                      </div>

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        Enrolled: {new Date(participant.enrollment_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        View Profile
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Update Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No participants found</p>
                <p className="text-sm text-muted-foreground">
                  Student enrollments will appear here
                </p>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}