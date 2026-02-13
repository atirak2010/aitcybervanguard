import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mockIncidents } from "@/data/mock-incidents";

export interface CriticalAlert {
  id: string;
  incidentId: string;
  description: string;
  timestamp: string;
  dismissed: boolean;
}

interface NotificationContextType {
  alerts: CriticalAlert[];
  unreadCount: number;
  dismissAlert: (id: string) => void;
  dismissBanner: () => void;
  bannerAlert: CriticalAlert | null;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Seed initial critical alerts from mock data
    const criticals = mockIncidents
      .filter((i) => i.severity === "critical" && i.status !== "closed")
      .map((i) => ({
        id: `NOTIF-${i.id}`,
        incidentId: i.id,
        description: i.description,
        timestamp: `${i.date}T${i.time}`,
        dismissed: false,
      }));
    setAlerts(criticals);

    // Simulated polling every 30s (structure ready for WebSocket)
    const interval = setInterval(() => {
      // In real mode, fetch new critical incidents here
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  }, []);

  const dismissBanner = useCallback(() => setBannerDismissed(true), []);

  const unreadCount = alerts.filter((a) => !a.dismissed).length;
  const bannerAlert = !bannerDismissed ? alerts.find((a) => !a.dismissed) ?? null : null;

  return (
    <NotificationContext.Provider value={{ alerts, unreadCount, dismissAlert, dismissBanner, bannerAlert }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
