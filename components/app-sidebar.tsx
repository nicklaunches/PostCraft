/**
 * @fileoverview Application sidebar navigation component
 *
 * Provides the main navigation sidebar for PostCraft studio with collapsible
 * functionality. Displays navigation items (Dashboard, Templates) and an adaptive
 * logo that hides when sidebar is collapsed.
 *
 * @module components/app-sidebar
 */

"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  Home,
  Mail,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

// PostCraft navigation data
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Templates",
      url: "/templates",
      icon: Mail,
    },
  ],
}

/**
 * Main application sidebar component
 *
 * Renders a collapsible sidebar with navigation items and logo.
 * Automatically marks the current page as active based on pathname.
 *
 * @param props - Sidebar component props
 * @returns {JSX.Element} The sidebar component
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Determine which nav item is active based on current pathname
  const navItems = data.navMain.map((item) => ({
    ...item,
    isActive:
      pathname === item.url ||
      (item.url === "/templates" && pathname.startsWith("/templates")),
  }))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Sidebar logo component with conditional visibility
 *
 * Displays the PostCraft logo (Mail icon + text) in the expanded state.
 * Hides text when sidebar is collapsed to save space.
 *
 * @returns {JSX.Element} The logo component
 */
function SidebarLogo() {
  const { state } = useSidebar()

  return (
    <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
      <Mail className="h-6 w-6 shrink-0" />
      {state === "expanded" && (
        <span className="text-lg font-semibold">PostCraft</span>
      )}
    </div>
  )
}
