"use client"
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import EditActivityModal from "./[id]/EditActivityModal"

import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Grid, List, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu"
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

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
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button asChild>
                <Link href="/admin/activities/new">
                  <span className="mr-2">➕</span>
                  New Activity
                </Link>
              </Button>
            </div>
          </div>

          {/* Activities Content */}
          {viewMode === 'grid' ? (
            /* Grid View */
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
          ) : (
            /* Table View */
            <div className="border rounded-lg">
              {isLoading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ) : activities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Activity Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity: any) => (
                      <TableRow key={activity.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-semibold">{activity.name}</span>
                            <span className="text-xs text-muted-foreground">{activity.category || 'No category'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                            {activity.description || "No description provided"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.staff ? (
                            <div className="text-sm">
                              {activity.staff.first_name} {activity.staff.last_name}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {activity.current_participants || 0} / {activity.max_participants || "∞"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {activity.start_date ? (
                              <div>
                                <div>{new Date(activity.start_date).toLocaleDateString()}</div>
                                {activity.end_date && (
                                  <div className="text-muted-foreground">
                                    to {new Date(activity.end_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No dates set</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedActivityId(activity.id)
                                  setModalOpen(true)
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditActivityId(activity.id)
                                  setEditModalOpen(true)
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : showPlaceholder ? (
                <div className="p-12">
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
          )}
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
