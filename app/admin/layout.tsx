"use client"

import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useState } from "react"
import { SidebarProvider } from "@/components/admin/sidebar-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarProvider value={{ isCollapsed, toggleSidebar }}>
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}
