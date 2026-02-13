export type UserRole = "analyst" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  analyst: "Analyst",
  manager: "Manager",
  admin: "Admin",
};

export const ROLE_PERMISSIONS = {
  analyst: {
    viewDashboard: true,
    viewIncidents: true,
    investigateIncidents: true,
    closeIncidents: false,
    exportCsv: false,
    viewAuditLog: false,
    endpointActions: false,
    advancedEndpointActions: false,
    exportAuditCsv: false,
  },
  manager: {
    viewDashboard: true,
    viewIncidents: true,
    investigateIncidents: true,
    closeIncidents: true,
    exportCsv: true,
    viewAuditLog: true,
    endpointActions: true,
    advancedEndpointActions: false,
    exportAuditCsv: false,
  },
  admin: {
    viewDashboard: true,
    viewIncidents: true,
    investigateIncidents: true,
    closeIncidents: true,
    exportCsv: true,
    viewAuditLog: true,
    endpointActions: true,
    advancedEndpointActions: true,
    exportAuditCsv: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.analyst;
