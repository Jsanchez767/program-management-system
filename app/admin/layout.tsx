"use client"

import type React from "react"
import { SharedLayout } from "@/components/shared/shared-layout"
import { adminNavigation } from "@/components/shared/navigation-config"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SharedLayout title="Admin Dashboard" navigation={adminNavigation}>
      {children}
    </SharedLayout>
  )
}
