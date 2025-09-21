import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, ShoppingCart, FileText, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { getDashboardStats, getPrograms } from "@/lib/database/operations"
import type { ProgramWithInstructor } from "@/lib/types/database"

async function getDashboardData() {
  const [stats, recentPrograms] = await Promise.all([
    getDashboardStats(),
    getPrograms()
  ])

  return {
    stats,
    recentPrograms: recentPrograms.slice(0, 5) // Get first 5 programs
  }
}

  // Get pending documents
  const { data: pendingDocs } = await supabase.from("documents").select("id").eq("status", "pending")

  // Get total participants
  const { data: participants } = await supabase.from("program_participants").select("id").eq("status", "active")

  const totalPrograms = programs?.length || 0
  const activePrograms = programs?.filter((p) => p.status === "active").length || 0
  const totalParticipants = participants?.length || 0
  const pendingPOsCount = pendingPOs?.length || 0
  const pendingDocsCount = pendingDocs?.length || 0

  return {
    totalPrograms,
    activePrograms,
    totalParticipants,
    pendingPOs: pendingPOsCount,
    pendingDocuments: pendingDocsCount,
  }
}

async function getRecentPrograms() {
  const supabase = await createClient()

  const { data: programs } = await supabase
    .from("programs")
    .select(`
      id,
      name,
      status,
      created_at,
      profiles!programs_instructor_id_fkey (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  return programs || []
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()
  const recentPrograms = await getRecentPrograms()

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your programs today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Programs"
              value={stats.totalPrograms}
              description="All programs in system"
              icon={BookOpen}
            />
            <StatsCard
              title="Active Programs"
              value={stats.activePrograms}
              description="Currently running"
              icon={TrendingUp}
            />
            <StatsCard
              title="Total Participants"
              value={stats.totalParticipants}
              description="Enrolled students"
              icon={Users}
            />
            <StatsCard
              title="Pending Approvals"
              value={stats.pendingPOs + stats.pendingDocuments}
              description="Requires attention"
              icon={Clock}
            />
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <ShoppingCart className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-medium">Purchase Orders</h3>
                    <p className="text-sm text-muted-foreground">{stats.pendingPOs} pending</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                    <FileText className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-medium">Documents</h3>
                    <p className="text-sm text-muted-foreground">{stats.pendingDocuments} to review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Programs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Recent Programs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{program.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(program.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs ${
                          program.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {program.status}
                      </div>
                    </div>
                  ))}
                  {recentPrograms.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">No programs created yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {(stats.pendingPOs > 0 || stats.pendingDocuments > 0) && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-orange-700 dark:text-orange-300">
                  {stats.pendingPOs > 0 && <p>• {stats.pendingPOs} purchase orders awaiting approval</p>}
                  {stats.pendingDocuments > 0 && <p>• {stats.pendingDocuments} documents need review</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
