"use client"

import type React from "react"
import { SharedLayout } from "@/components/shared/shared-layout"
import { participantNavigation } from "@/components/shared/navigation-config"

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SharedLayout title="Student Dashboard" navigation={participantNavigation}>
      {children}
    </SharedLayout>
  )
}
