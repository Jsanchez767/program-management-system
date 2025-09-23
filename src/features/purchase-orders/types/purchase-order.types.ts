// Purchase order specific types
export interface PurchaseOrder {
  id: string
  order_number: string
  organization_id: string
  activity_id?: string
  vendor_name: string
  vendor_contact?: {
    email?: string
    phone?: string
    address?: string
  }
  items: PurchaseOrderItem[]
  subtotal: number
  tax_amount?: number
  shipping_cost?: number
  total_amount: number
  status: 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled'
  requested_by: string
  approved_by?: string
  ordered_date?: string
  expected_delivery?: string
  delivery_date?: string
  notes?: string
  custom_fields: Record<string, any>
  created_at: string
  updated_at: string
  program?: {
    id: string
    name: string
  }
  requester?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface PurchaseOrderItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  category?: string
  notes?: string
}

export interface PurchaseOrderFormData {
  vendor_name: string
  vendor_contact?: {
    email?: string
    phone?: string
    address?: string
  }
  activity_id?: string
  items: Omit<PurchaseOrderItem, 'id'>[]
  tax_amount?: number
  shipping_cost?: number
  expected_delivery?: string
  notes?: string
  custom_fields?: Record<string, any>
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrder['status']
  activity_id?: string
  vendor_name?: string
  date_range?: {
    start: string
    end: string
  }
  amount_range?: {
    min: number
    max: number
  }
}