"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider } from "@/components/admin/sidebar-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
