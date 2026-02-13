import { useQuery } from "@tanstack/react-query";
import { db } from "@/db/csocDatabase";
import type { Incident, Artifact, AlertSummary } from "@/types/incidents";
import { fetchIncidentExtraData } from "@/services/api";

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

/**
 * Fetch extra data (artifacts + alert details) for a specific incident.
 * This runs as a separate query so the incident detail page loads instantly
 * from IndexedDB while artifacts load asynchronously from the XDR API.
 */
export function useIncidentExtraData(id: string | undefined) {
  return useQuery<{ artifacts: Artifact[]; alerts: AlertSummary[] } | null>({
    queryKey: ["incident-extra", id],
    queryFn: async () => {
      if (!id) return null;
      return fetchIncidentExtraData(id);
    },
    enabled: !!id,
    staleTime: 5 * 60_000, // cache for 5 min
    retry: 1,
  });
}
