"use client"

import type React from "react"
import { SharedLayout } from "@/components/shared/shared-layout"
import { staffNavigation } from "@/components/shared/navigation-config"

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SharedLayout title="Staff Dashboard" navigation={staffNavigation}>
      {children}
    </SharedLayout>
  )
}
