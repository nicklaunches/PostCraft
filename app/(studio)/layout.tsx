/**
 * @fileoverview Studio layout component for PostCraft dashboard
 *
 * Root layout for all studio pages at `/studio` route. Provides the shell layout
 * with shadcn/ui sidebar-07 template featuring:
 *
 * Layout Structure:
 * - Collapsible sidebar with navigation items (built by AppSidebar component)
 * - Header with sidebar trigger button and separator
 * - Content inset area for page-specific content
 * - Responsive design: collapses on mobile, expands on desktop
 *
 * Sidebar Configuration:
 * - Uses shadcn/ui SidebarProvider for state management
 * - AppSidebar component renders navigation items
 * - SidebarTrigger button toggles collapsed state
 * - Automatically adjusts header height when sidebar collapses
 *
 * Child Routes:
 * - `/`: Dashboard home page
 * - `/templates`: Template list page
 * - `/templates/new`: Create new template page
 * - `/templates/[id]/edit`: Edit template page
 *
 * @example
 * // Studio layout with sidebar and content area
 * export default function StudioLayout({ children }) {
 *   return (
 *     <SidebarProvider>
 *       <AppSidebar />
 *       <SidebarInset>
 *         // Header with sidebar trigger
 *         {children}
 *       </SidebarInset>
 *     </SidebarProvider>
 *   );
 * }
 */

import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
