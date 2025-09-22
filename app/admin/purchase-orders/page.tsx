"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { PurchaseOrder } from "@/lib/types/database"
import { useEffect, useState } from "react"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPurchaseOrders() {
      try {
        const supabase = createClient()
        
        // Get current user and their organization from metadata
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get organization_id from user metadata
        const organizationId = user.user_metadata?.organization_id
        if (!organizationId) return

        // Fetch purchase orders for this organization
        const { data: purchaseOrdersData } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })

        setPurchaseOrders(purchaseOrdersData || [])
      } catch (error) {
        console.error('Error fetching purchase orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchaseOrders()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "ordered":
        return "bg-blue-100 text-blue-800"
      case "received":
        return "bg-purple-100 text-purple-800"
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
                <h1 className="text-3xl font-bold mb-2">Purchase Orders</h1>
                <p className="text-muted-foreground">
                  Review and manage purchase order requests from instructors
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchaseOrders.length > 0 ? (
              purchaseOrders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{order.title}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {order.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      {order.vendor && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">🏪</span>
                          {order.vendor}
                        </div>
                      )}

                      {order.total_amount && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">💰</span>
                          ${order.total_amount} {order.currency}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      {order.status === 'submitted' && (
                        <>
                          <Button size="sm" className="flex-1">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">No purchase orders found</p>
                <p className="text-sm text-muted-foreground">
                  Purchase orders from instructors will appear here
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