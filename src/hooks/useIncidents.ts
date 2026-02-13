import { useQuery } from "@tanstack/react-query";
import { db } from "@/db/csocDatabase";
import type { Incident } from "@/types/incidents";

export function useIncidents() {
  return useQuery<Incident[]>({
    queryKey: ["incidents"],
    queryFn: async () => {
      const count = await db.incidents.count();
      if (count === 0) return [];
      return db.incidents.orderBy("date").reverse().toArray();
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useIncidentById(id: string | undefined) {
  return useQuery<Incident | undefined>({
    queryKey: ["incidents", id],
    queryFn: async () => {
      if (!id) return undefined;
      return db.incidents.get(id);
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
