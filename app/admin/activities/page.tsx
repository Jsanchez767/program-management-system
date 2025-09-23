"use client"
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
import EditActivityModal from "./[id]/EditActivityModal"

import { AdminSidebar } from "@/shared/components/layout/AdminSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Grid, List, MoreHorizontal, Edit, Trash2, Search, Filter, Eye, EyeOff, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/shared/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import Link from "next/link"
import { useRealtimeActivities } from "@/lib/realtime-hooks"
import { useUser } from "@/shared/hooks/use-user"
import { useEffect, useState, useMemo } from "react"
import ActivityModal from "./[id]/ActivityModal"
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering

export default function ActivitiesPage() {
  const { user, loading } = useUser()
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const activities = useRealtimeActivities(organizationId || '')
  const supabase = createClient()
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    description: true,
    category: true,
    staff: true,
    participants: true,
    dates: true,
    status: true,
    actions: true
  })

  // Inline editing states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingCell, setEditingCell] = useState<{activityId: string, field: string} | null>(null)
  const [editValue, setEditValue] = useState('')

  // Modal states
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editActivityId, setEditActivityId] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Get organization ID from user metadata
  useEffect(() => {
    const getOrganizationId = async () => {
      if (user?.user_metadata?.organization_id) {
        setOrganizationId(user.user_metadata.organization_id)
      }
    }
    if (user) {
      getOrganizationId()
    }
  }, [user])

  // Filter and sort activities
  const filteredAndSortedActivities = useMemo(() => {
    let filtered = activities.filter((activity: any) => {
      // Search filter
      const matchesSearch = activity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.staff?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.staff?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || activity.status === statusFilter
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]
      
      // Handle special cases
      if (sortColumn === 'staff') {
        aValue = a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : ''
        bValue = b.staff ? `${b.staff.first_name} ${b.staff.last_name}` : ''
      } else if (sortColumn === 'participants') {
        aValue = a.current_participants || 0
        bValue = b.current_participants || 0
      } else if (sortColumn === 'dates') {
        aValue = a.start_date || ''
        bValue = b.start_date || ''
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [activities, searchTerm, statusFilter, categoryFilter, sortColumn, sortDirection])

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = activities.map((activity: any) => activity.status).filter(Boolean)
    return [...new Set(statuses)]
  }, [activities])

  const uniqueCategories = useMemo(() => {
    const categories = activities.map((activity: any) => activity.category).filter(Boolean)
    return [...new Set(categories)]
  }, [activities])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const toggleColumnVisibility = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }))
  }

  const handleCellClick = (activityId: string, field: string, currentValue: string) => {
    if (isEditMode) {
      setEditingCell({ activityId, field })
      setEditValue(currentValue || '')
    }
  }

  const handleCellSave = async () => {
    if (!editingCell) return
    
    try {
      // Update the activity in Supabase
      const { error } = await supabase
        .from('activities')
        .update({ [editingCell.field]: editValue })
        .eq('id', editingCell.activityId)
      
      if (error) {
        console.error('Error updating activity:', error)
        return
      }
      
      setEditingCell(null)
      setEditValue('')
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave()
    } else if (e.key === 'Escape') {
      handleCellCancel()
    }
  }

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

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
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

            {/* Advanced Controls - Only show in table view */}
            {viewMode === 'table' && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/50 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Edit Data and Column Visibility Controls */}
                <div className="flex items-center gap-2">
                  {/* Edit Data Toggle */}
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {isEditMode ? 'Exit Edit' : 'Edit Data'}
                  </Button>

                  {/* Column Visibility */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(visibleColumns).map(([column, isVisible]) => (
                        <DropdownMenuCheckboxItem
                          key={column}
                          checked={isVisible}
                          onCheckedChange={() => toggleColumnVisibility(column as keyof typeof visibleColumns)}
                          className="capitalize"
                        >
                          {column === 'actions' ? 'Actions' : column}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          {/* Activities Content */}
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-32 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredAndSortedActivities.length > 0 ? (
                filteredAndSortedActivities.map((activity: any) => (
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
              ) : (
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
              )}
            </div>
          ) : (
            /* Advanced Table View */
            <div className="border rounded-lg">
              {loading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ) : filteredAndSortedActivities.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.name && (
                        <TableHead className="w-[200px]">
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('name')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Activity Name
                            {sortColumn === 'name' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.description && <TableHead>Description</TableHead>}
                      {visibleColumns.category && (
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('category')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Category
                            {sortColumn === 'category' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.staff && (
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('staff')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Staff
                            {sortColumn === 'staff' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.participants && (
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('participants')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Participants
                            {sortColumn === 'participants' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.dates && (
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('dates')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Dates
                            {sortColumn === 'dates' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.status && (
                        <TableHead>
                          <Button
                            variant="ghost"
                            onClick={() => handleSort('status')}
                            className="h-auto p-0 font-semibold hover:bg-transparent"
                          >
                            Status
                            {sortColumn === 'status' && (
                              sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                      )}
                      {visibleColumns.actions && <TableHead className="w-[100px]">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedActivities.map((activity: any) => (
                      <TableRow key={activity.id} className="hover:bg-muted/50">
                        {visibleColumns.name && (
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              {editingCell?.activityId === activity.id && editingCell?.field === 'name' ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  className="h-8"
                                />
                              ) : (
                                <span 
                                  className={`font-semibold ${isEditMode ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : ''}`}
                                  onClick={() => handleCellClick(activity.id, 'name', activity.name)}
                                >
                                  {activity.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.description && (
                          <TableCell>
                            <div className="max-w-[300px]">
                              {editingCell?.activityId === activity.id && editingCell?.field === 'description' ? (
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  onBlur={handleCellSave}
                                  autoFocus
                                  className="h-8"
                                />
                              ) : (
                                <div 
                                  className={`truncate text-sm text-muted-foreground ${isEditMode ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : ''}`}
                                  onClick={() => handleCellClick(activity.id, 'description', activity.description)}
                                >
                                  {activity.description || "No description provided"}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.category && (
                          <TableCell>
                            {editingCell?.activityId === activity.id && editingCell?.field === 'category' ? (
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                onBlur={handleCellSave}
                                autoFocus
                                className="h-8"
                              />
                            ) : (
                              <div 
                                className={`${isEditMode ? 'cursor-pointer hover:bg-muted/50 px-2 py-1 rounded' : ''}`}
                                onClick={() => handleCellClick(activity.id, 'category', activity.category)}
                              >
                                <Badge variant="outline">
                                  {activity.category || 'Uncategorized'}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.staff && (
                          <TableCell>
                            {activity.staff ? (
                              <div className="text-sm">
                                {activity.staff.first_name} {activity.staff.last_name}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.participants && (
                          <TableCell>
                            <div className="text-sm">
                              {activity.current_participants || 0} / {activity.max_participants || "∞"}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.dates && (
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
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.actions && (
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
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12">
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                          <span className="text-4xl">📚</span>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No activities found</h3>
                        <p className="text-muted-foreground mb-6">
                          {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                            ? "Try adjusting your filters or search terms."
                            : "Get started by creating your first educational activity."
                          }
                        </p>
                        {(!searchTerm && statusFilter === 'all' && categoryFilter === 'all') && (
                          <Button asChild>
                            <Link href="/admin/activities/new">
                              <span className="mr-2">➕</span>
                              Create Activity
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
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
