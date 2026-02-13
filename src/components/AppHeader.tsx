import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { ROLE_LABELS } from "@/types/auth";
import { Bell, LogOut, Shield, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { formatDateTime } from "@/lib/utils";

export function AppHeader() {
  const { user, logout } = useAuth();
  const { alerts, unreadCount, dismissAlert } = useNotifications();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-xl px-4 shadow-md shadow-black/[0.03] dark:shadow-black/20 dark:border-white/[0.06]">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground">AIT Cyber Vanguard</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-severity-critical px-1 text-[10px] font-bold text-white shadow-md shadow-severity-critical/30 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <p className="mb-2 text-sm font-semibold">Critical Alerts</p>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alerts</p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-auto">
                {alerts.map((a) => (
                  <div key={a.id} className={`rounded-md border p-2 text-xs ${a.dismissed ? "opacity-50" : "border-severity-critical/30 bg-severity-critical/5"}`}>
                    <p className="font-medium">{a.incidentId}: {a.description}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground">{formatDateTime(a.timestamp)}</span>
                      {!a.dismissed && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { navigate(`/incidents/${a.incidentId}`); }}>View</Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => dismissAlert(a.id)}>Dismiss</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* User info */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{user.name}</span>
          <Badge variant="secondary" className="capitalize text-xs">{ROLE_LABELS[user.role]}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
