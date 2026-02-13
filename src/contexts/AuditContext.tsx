import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { AuditEntry, ActionType, AuditStatus } from "@/types/audit";
import { db } from "@/db/csocDatabase";
import { useAuth } from "./AuthContext";

interface AuditContextType {
  auditLog: AuditEntry[];
  addAuditEntry: (actionType: ActionType, target: string, status: AuditStatus, comment: string) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const { user } = useAuth();

  // Load from IndexedDB on mount
  useEffect(() => {
    db.auditLog
      .orderBy("timestamp")
      .reverse()
      .toArray()
      .then(setAuditLog)
      .catch(() => {});
  }, []);

  const addAuditEntry = useCallback(
    (actionType: ActionType, target: string, status: AuditStatus, comment: string) => {
      const entry: AuditEntry = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: user?.name ?? "Unknown",
        role: user?.role ?? "unknown",
        actionType,
        target,
        status,
        comment,
      };
      setAuditLog((prev) => [entry, ...prev]);
      db.auditLog.put(entry).catch(() => {});
    },
    [user]
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
