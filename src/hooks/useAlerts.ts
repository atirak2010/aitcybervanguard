import { useQuery } from "@tanstack/react-query";
import { db } from "@/db/csocDatabase";
import type { Alert } from "@/types/alerts";

export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const count = await db.alerts.count();
      if (count === 0) return [];
      return db.alerts.orderBy("timestamp").reverse().toArray();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
