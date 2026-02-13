import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { db } from "@/db/csocDatabase";

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
    async function loadCriticals() {
      try {
        const criticals = await db.incidents
          .where("severity")
          .equals("critical")
          .filter((i) => i.status !== "closed")
          .toArray();

        setAlerts((prev) => {
          const dismissedIds = new Set(prev.filter((a) => a.dismissed).map((a) => a.id));
          return criticals.map((i) => ({
            id: `NOTIF-${i.id}`,
            incidentId: i.id,
            description: i.description,
            timestamp: `${i.date}T${i.time}`,
            dismissed: dismissedIds.has(`NOTIF-${i.id}`),
          }));
        });
      } catch {
        // IndexedDB not ready yet — will retry on next interval
      }
    }

    loadCriticals();
    const interval = setInterval(loadCriticals, 30000);
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
