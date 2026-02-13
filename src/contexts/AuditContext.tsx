import React, { createContext, useContext, useState, useCallback } from "react";
import { AuditEntry, ActionType, AuditStatus } from "@/types/audit";
import { mockAuditLog } from "@/data/mock-audit";
import { useAuth } from "./AuthContext";

interface AuditContextType {
  auditLog: AuditEntry[];
  addAuditEntry: (actionType: ActionType, target: string, status: AuditStatus, comment: string) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(mockAuditLog);
  const { user } = useAuth();

  const addAuditEntry = useCallback(
    (actionType: ActionType, target: string, status: AuditStatus, comment: string) => {
      const entry: AuditEntry = {
        id: `AUD-${String(auditLog.length + 1).padStart(3, "0")}`,
        timestamp: new Date().toISOString(),
        user: user?.name ?? "Unknown",
        role: user?.role ?? "unknown",
        actionType,
        target,
        status,
        comment,
      };
      setAuditLog((prev) => [entry, ...prev]);
    },
    [auditLog.length, user]
  );

  return (
    <AuditContext.Provider value={{ auditLog, addAuditEntry }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used within AuditProvider");
  return context;
}
