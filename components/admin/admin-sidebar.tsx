"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSidebar } from "./sidebar-context"

const navigation = [
  { name: "Overview", href: "/admin", icon: "📊" },
  { name: "Programs", href: "/admin/activities", icon: "📚" },
  { name: "Trips", href: "/admin/trips", icon: "🚌" },
  { name: "Participants", href: "/admin/participants", icon: "👥" },
  { name: "Invitations", href: "/admin/invitations", icon: "✉️" },
  { name: "Purchase Orders", href: "/admin/purchase-orders", icon: "🛒" },
  { name: "Documents", href: "/admin/documents", icon: "📄" },
  { name: "Announcements", href: "/admin/announcements", icon: "📢" },
  { name: "Settings", href: "/admin/settings", icon: "⚙️" },
]

export function AdminSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isCollapsed, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    router.push("/auth/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "relative bg-card border-r border-border transition-all duration-300 ease-in-out flex-shrink-0",
          // Desktop behavior - responsive width based on collapsed state
          isCollapsed ? "w-16" : "w-64",
          // Mobile behavior - overlay with transform
          "lg:block",
          isMobileMenuOpen ? "block" : "hidden lg:block"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            "flex items-center h-16 px-4 border-b border-border transition-all duration-300",
            isCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isCollapsed ? (
              <h1 className="text-lg font-semibold text-foreground">Admin Dashboard</h1>
            ) : (
              <span className="text-xl">⚡</span>
            )}
            
            {/* Desktop collapse button */}
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {isCollapsed ? "→" : "←"}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 space-y-2 overflow-hidden">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className={cn("text-base flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sign out */}
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              className={cn(
                "w-full text-muted-foreground hover:text-foreground transition-all duration-300",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={handleSignOut}
              title={isCollapsed ? "Sign Out" : undefined}
            >
              <span className={cn("flex-shrink-0", isCollapsed ? "mr-0" : "mr-3")}>🚪</span>
              {!isCollapsed && <span>Sign Out</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
