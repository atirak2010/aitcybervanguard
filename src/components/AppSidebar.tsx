import { LayoutDashboard, AlertTriangle, Monitor, FileText, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Shield } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Incidents", url: "/incidents", icon: AlertTriangle },
  { title: "Endpoints", url: "/endpoints", icon: Monitor },
];

const restrictedItems = [
  { title: "Audit Log", url: "/audit-log", icon: FileText, requiredRole: ["manager", "admin"] as string[] },
  { title: "Settings", url: "/settings", icon: Settings, requiredRole: ["admin"] as string[] },
];

export function AppSidebar() {
  const { user, hasPermission } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary/20 shadow-md shadow-sidebar-primary/10">
            <Shield className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground">AIT Cyber Vanguard</p>
            <p className="text-[11px] text-sidebar-foreground/50">Security Operations</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {restrictedItems.map((item) => {
                if (!user || !item.requiredRole.includes(user.role)) return null;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="flex items-center gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">v1.0 — Mock Mode</p>
      </SidebarFooter>
    </Sidebar>
  );
}
