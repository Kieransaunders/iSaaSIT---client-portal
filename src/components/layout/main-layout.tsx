import { AppSidebar } from "./app-sidebar";
import { ImpersonationBanner } from "./impersonation-banner";
import type { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MainLayoutProps {
  children: ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function MainLayout({ children, breadcrumbs }: MainLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:top-4 focus:left-4"
        >
          Skip to main content
        </a>
        <AppSidebar />
        <SidebarInset id="main-content">
        <ImpersonationBanner />
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="-ml-1 hover:bg-accent" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Toggle sidebar</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mr-2 h-4" />
            {breadcrumbs && breadcrumbs.length > 0 && (
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <BreadcrumbItem
                      key={crumb.label}
                      className={
                        index === breadcrumbs.length - 1
                          ? "hidden md:block"
                          : ""
                      }
                    >
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href || "#"}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator className="hidden md:block" />
                      )}
                    </BreadcrumbItem>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  </TooltipProvider>
  );
}
