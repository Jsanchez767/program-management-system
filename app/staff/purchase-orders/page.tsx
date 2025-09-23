import { StaffSidebar } from "@/shared/components/layout/StaffSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import Link from "next/link"

const mockPurchaseOrders = [
  {
    id: "1",
    title: "Laboratory Equipment",
    description: "Microscopes and lab supplies for chemistry experiments",
    status: "approved",
    program: { name: "Science Laboratory" },
    vendor: "Scientific Supply Co.",
    total_amount: "1250.00",
    currency: "USD",
    created_at: "2024-01-15T10:00:00Z",
    approved_at: "2024-01-16T14:30:00Z",
    approver: { first_name: "Dr. Sarah", last_name: "Johnson" },
  },
  {
    id: "2",
    title: "Art Supplies",
    description: "Paints, brushes, and canvases for creative workshop",
    status: "submitted",
    program: { name: "Creative Arts" },
    vendor: "Art World",
    total_amount: "450.00",
    currency: "USD",
    created_at: "2024-01-18T09:15:00Z",
  },
]

export default function InstructorPurchaseOrdersPage() {
  const purchaseOrders = mockPurchaseOrders

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "submitted":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "ordered":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "received":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-muted-foreground mt-2">Submit and track your purchase requests</p>
            </div>
            <Button asChild>
              <Link href="/staff/purchase-orders/new">
                <span className="mr-2">➕</span>
                New Purchase Order
              </Link>
            </Button>
          </div>

          {/* Purchase Orders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchaseOrders && purchaseOrders.length > 0 ? (
              purchaseOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{order.title}</CardTitle>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {order.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📚</span>
                        {order.program?.name || "No program assigned"}
                      </div>

                      {order.vendor && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">🛒</span>
                          {order.vendor}
                        </div>
                      )}

                      {order.total_amount && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span className="mr-2">💰</span>${Number.parseFloat(order.total_amount).toFixed(2)}{" "}
                          {order.currency}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">📅</span>
                        Created {new Date(order.created_at).toLocaleDateString()}
                      </div>

                      {order.approved_at && order.approver && (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Approved by {order.approver.first_name} {order.approver.last_name}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                        <Link href={`/staff/purchase-orders/${order.id}`}>View Details</Link>
                      </Button>
                      {order.status === "draft" && (
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                          <Link href={`/staff/purchase-orders/${order.id}/edit`}>Edit</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="text-center">
                      <span className="text-4xl mb-4 block">🛒</span>
                      <h3 className="text-lg font-medium text-foreground mb-2">No purchase orders yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Submit your first purchase order to request materials and supplies.
                      </p>
                      <Button asChild>
                        <Link href="/staff/purchase-orders/new">
                          <span className="mr-2">➕</span>
                          Create Purchase Order
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
