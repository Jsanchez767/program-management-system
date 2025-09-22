"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true)
      const supabase = createClient()
      // Get all users for this organization
      const { data: { user } } = await supabase.auth.getUser()
      let organizationId = user?.user_metadata?.organization_id
      if (!organizationId) return
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('raw_user_meta_data->>organization_id', organizationId)
      setUsers(usersData || [])
      setIsLoading(false)
    }
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId: string, newRole: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole }
    })
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Role updated", description: `User role changed to ${newRole}` })
      setUsers(users => users.map(u => u.id === userId ? { ...u, raw_user_meta_data: { ...u.raw_user_meta_data, role: newRole } } : u))
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">No users found</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium">{user.raw_user_meta_data?.first_name} {user.raw_user_meta_data?.last_name}</div>
                    <div className="text-muted-foreground text-sm">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{user.raw_user_meta_data?.role || "unknown"}</Badge>
                    <Select value={user.raw_user_meta_data?.role || "student"} onValueChange={(val) => handleRoleChange(user.id, val)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
