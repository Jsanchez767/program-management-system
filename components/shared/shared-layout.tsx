"use client"

import type React from "react"
import { SidebarProvider } from "./sidebar-context"
import { UnifiedSidebar, NavigationItem } from "./unified-sidebar"

interface SharedLayoutProps {
  children: React.ReactNode
  title: string
  navigation: NavigationItem[]
}

export function SharedLayout({ children, title, navigation }: SharedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex">
        <UnifiedSidebar title={title} navigation={navigation} />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </SidebarProvider>
  )
}