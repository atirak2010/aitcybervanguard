import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import IncidentsPage from "@/pages/IncidentsPage";
import IncidentDetailPage from "@/pages/IncidentDetailPage";
import EndpointsPage from "@/pages/EndpointsPage";
import AuditLogPage from "@/pages/AuditLogPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requiredPermission }: { children: React.ReactNode; requiredPermission?: string }) {
  const { user, hasPermission } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requiredPermission && !hasPermission(requiredPermission as any)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="incidents/:id" element={<IncidentDetailPage />} />
        <Route path="endpoints" element={<EndpointsPage />} />
        <Route path="audit-log" element={<ProtectedRoute requiredPermission="viewAuditLog"><AuditLogPage /></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute requiredPermission="viewAuditLog"><SettingsPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
        <AuditProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AuthRouter />
            </BrowserRouter>
          </NotificationProvider>
        </AuditProvider>
      </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
