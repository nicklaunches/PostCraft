/**
 * @fileoverview Main navigation menu component for sidebar
 *
 * Renders navigation items with support for both simple links and collapsible
 * sub-menu sections. Highlights active items based on current page.
 *
 * @module components/nav-main
 */

"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

/**
 * Navigation menu component
 *
 * Renders a list of navigation items in the sidebar. Supports:
 * - Simple navigation links with optional icons
 * - Collapsible sections with sub-items
 * - Active state indication
 * - Animated chevron rotation on expand/collapse
 *
 * @param props - Component props
 * @param props.items - Array of navigation items with optional sub-items
 * @returns {JSX.Element} The navigation menu
 *
 * @example
 * const items = [
 *   {
 *     title: "Dashboard",
 *     url: "/",
 *     icon: Home,
 *     isActive: true
 *   },
 *   {
 *     title: "Content",
 *     icon: BookOpen,
 *     items: [
 *       { title: "Posts", url: "/posts" },
 *       { title: "Pages", url: "/pages" }
 *     ]
 *   }
 * ];
 * <NavMain items={items} />
 */
export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // If item has no sub-items, render as simple link
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title} isActive={item.isActive}>
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // If item has sub-items, render as collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
