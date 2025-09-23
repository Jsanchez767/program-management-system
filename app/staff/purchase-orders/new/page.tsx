"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StaffSidebar } from "@/shared/components/layout/StaffSidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

interface PurchaseItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export default function NewPurchaseOrderPage() {
  const [formData, setFormData] = useState({
    activity_id: "",
    title: "",
    description: "",
    vendor: "",
    justification: "",
    status: "draft",
  })
  const [items, setItems] = useState<PurchaseItem[]>([{ description: "", quantity: 1, unit_price: 0, total: 0 }])
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadActivities = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("activities")
        .select("id, name")
        .eq("staff_id", user.id)
        .eq("status", "active")
        .order("name")
      setActivities(data || [])
    }
    loadActivities()
  }, [])

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const totalAmount = calculateTotal()
      const validItems = items.filter((item) => item.description.trim() !== "")

      const { error } = await supabase.from("purchase_orders").insert({
        activity_id: formData.activity_id,
        staff_id: user.id,
        title: formData.title,
        description: formData.description || null,
        vendor: formData.vendor || null,
        total_amount: totalAmount,
        currency: "USD",
        items: validItems,
        justification: formData.justification || null,
        status: formData.status,
        submitted_at: formData.status === "submitted" ? new Date().toISOString() : null,
      })

      if (error) throw error

      router.push("/staff/purchase-orders")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0, total: 0 }])
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate total for this item
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }

    setItems(newItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-background">
      <StaffSidebar />

      <div className="lg:pl-64">
        <main className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" asChild>
              <Link href="/staff/purchase-orders">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Purchase Order</h1>
              <p className="text-muted-foreground mt-2">Submit a request for materials and supplies</p>
            </div>
          </div>

          {/* Form */}
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Purchase Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program">Program *</Label>
                    <Select
                      value={formData.activity_id}
                      onValueChange={(value) => updateFormData("activity_id", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {activities.map((program) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="submitted">Submit for Approval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Purchase Order Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormData("title", e.target.value)}
                    placeholder="Enter purchase order title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor/Supplier</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => updateFormData("vendor", e.target.value)}
                    placeholder="Enter vendor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Brief description of the purchase request"
                    rows={3}
                  />
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Items to Purchase</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={index} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2 space-y-2">
                            <Label>Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(index, "description", e.target.value)}
                              placeholder="Item description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                              min="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Unit Price ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">Total: ${item.total.toFixed(2)}</div>
                            {items.length > 1 && (
                              <Button type="button" variant="outline" size="icon" onClick={() => removeItem(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold">Grand Total: ${calculateTotal().toFixed(2)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">Justification *</Label>
                  <Textarea
                    id="justification"
                    value={formData.justification}
                    onChange={(e) => updateFormData("justification", e.target.value)}
                    placeholder="Explain why these items are needed for your program"
                    rows={4}
                    required
                  />
                </div>

                {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : formData.status === "submitted" ? "Submit for Approval" : "Save Draft"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/staff/purchase-orders">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
