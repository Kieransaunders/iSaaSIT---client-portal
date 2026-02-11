import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import {
  BookOpen,
  Building2,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { api } from "../../../convex/_generated/api";
import { BLOG_URL, DOCS_URL } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Navigation items for the sidebar
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff", "client"], // Available to all roles
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Building2,
    roles: ["admin", "staff"], // Hidden from clients
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
    roles: ["admin"], // Admin only
  },
];

const adminNavItems = [
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
    roles: ["admin"], // Admin only
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ["admin"], // Admin only
  },
];

const resourceNavItems = [
  {
    title: "Tools",
    url: "/tools",
    icon: Wrench,
    roles: ["admin"],
  },
  {
    title: "Documentation",
    url: DOCS_URL,
    icon: BookOpen,
    external: true,
    roles: ["admin", "staff"],
  },
  {
    title: "Blog",
    url: BLOG_URL,
    icon: BookOpen,
    external: true,
    roles: ["admin", "staff"],
  },
];

type NavItem = {
  title: string;
  url: string;
  icon: any;
  roles?: Array<string>;
  external?: boolean;
};

/**
 * Filter navigation items based on user role
 */
function filterNavByRole(items: Array<NavItem>, userRole?: string): Array<NavItem> {
  if (!userRole) return [];
  return items.filter((item) => !item.roles || item.roles.includes(userRole));
}

export function AppSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const org = useQuery(api.orgs.get.getMyOrg);
  const userInfo = useQuery(api.orgs.get.hasOrg);

  // Get user role, default to 'client' if not set
  const userRole = userInfo?.role || "client";

  // Filter navigation items based on role
  const filteredMainNav = filterNavByRole(mainNavItems, userRole);
  const filteredAdminNav = filterNavByRole(adminNavItems, userRole);
  const filteredResourceNav = filterNavByRole(resourceNavItems, userRole);

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  const isActiveRoute = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(`${url}/`);
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">iSaaSIT</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {org?.name || "Workspace"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Platform Navigation - Show only if there are items */}
        {filteredMainNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administration Navigation - Show only if there are items */}
        {filteredAdminNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.url)}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Resources - Show only if there are items */}
        {filteredResourceNav.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Resources</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredResourceNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={!item.external && isActiveRoute(item.url)}
                    >
                      {item.external ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      ) : (
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
                      {getInitials(user?.firstName ?? null, user?.email ?? '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- user can be null */}
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName || user?.email}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile (coming soon)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
