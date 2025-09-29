"use client"

import { createContext, useContext } from "react"

// Sidebar context interface
export interface SidebarContextType {
  isCollapsed: boolean
  toggleSidebar: () => void
}

// Create the context
export const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

// Provider component for easier usage
export const SidebarProvider = SidebarContext.Provider