"use client"
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import EditActivityModal from "./[id]/EditActivityModal"

import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import Link from "next/link"
import { useRealtimeActivities } from "@/lib/realtime-hooks"
import { useUser } from "@/shared/hooks/use-user"
import { useEffect, useState } from "react"
import ActivityModal from "./[id]/ActivityModal"

// Force dynamic rendering

export default function AdminActivitiesPage() {
  const { user } = useUser()
  const organizationId = user?.user_metadata?.organization_id
  const realtimeActivities = useRealtimeActivities(organizationId || "")
  const [activities, setActivities] = useState<any[]>([])
  const [hasDataLoaded, setHasDataLoaded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  const isLoading = !organizationId || !hasDataLoaded || !isMounted

  // Ensure we're client-side before showing any content
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Delayed placeholder - only show after 3 seconds if no programs and data has loaded
  useEffect(() => {
    if (hasDataLoaded && isMounted && activities.length === 0) {
      const timer = setTimeout(() => {
        setShowPlaceholder(true)
      }, 3000) // 3 second delay

      return () => clearTimeout(timer)
    } else {
      setShowPlaceholder(false)
    }
  }, [hasDataLoaded, isMounted, activities.length])

  // Sync local activities state with realtime updates
  useEffect(() => {
    if (organizationId && realtimeActivities !== undefined) {
      setActivities(realtimeActivities || [])
      setHasDataLoaded(true)
    }
  }, [realtimeActivities, organizationId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editActivityId, setEditActivityId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Activities</h1>
              <p className="text-muted-foreground mt-2">Manage all educational activities and programs</p>
            </div>
            <Button asChild>
              <Link href="/admin/activities/new">
                <span className="mr-2">➕</span>
                New Activity
              </Link>
            </Button>
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity: any) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{activity.name}</CardTitle>
                      <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.description || "No description provided"}
                    </p>
                    <div className="space-y-2">
                      {activity.staff && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">👤</span>
                          {activity.staff.first_name} {activity.staff.last_name}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">👥</span>
                        {activity.current_participants || 0} / {activity.max_participants || "Unlimited"} participants
                      </div>
                      {activity.start_date && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">📅</span>
                          {new Date(activity.start_date).toLocaleDateString()}
                          {activity.end_date && ` - ${new Date(activity.end_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => {
                          setSelectedActivityId(activity.id)
                          setModalOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : showPlaceholder ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                        <span className="text-4xl">📚</span>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No activities yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Get started by creating your first educational activity.
                      </p>
                      <Button asChild>
                        <Link href="/admin/activities/new">
                          <span className="mr-2">➕</span>
                          Create Activity
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
          {/* Activity Details Modal */}
          {selectedActivityId && (
            <ActivityModal
              activityId={selectedActivityId}
              open={modalOpen}
              onOpenChange={(open) => {
                setModalOpen(open)
                if (!open) setSelectedActivityId(null)
              }}
              onOptimisticUpdate={(updatedActivity) => {
                setActivities((prev) => prev.map(p => p.id === updatedActivity.id ? { ...p, ...updatedActivity } : p))
              }}
              organizationId={organizationId || ""}
            />
          )}
          {/* Edit Activity Modal */}
          {editActivityId && (
            <EditActivityModal
              activityId={editActivityId}
              open={editModalOpen}
              onOpenChange={(open) => {
                setEditModalOpen(open)
                if (!open) setEditActivityId(null)
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
