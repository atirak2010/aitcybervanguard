import { useState, useEffect } from "react";
import { onSyncChange, getSyncMeta } from "@/services/syncEngine";
import { useQueryClient } from "@tanstack/react-query";
import type { SyncMeta } from "@/db/csocDatabase";

export function useSyncStatus() {
  const queryClient = useQueryClient();
  const [incidentSync, setIncidentSync] = useState<SyncMeta | null>(null);
  const [endpointSync, setEndpointSync] = useState<SyncMeta | null>(null);

  useEffect(() => {
    getSyncMeta("incidents").then((m) => m && setIncidentSync(m));
    getSyncMeta("endpoints").then((m) => m && setEndpointSync(m));

    const unsubscribe = onSyncChange((meta) => {
      if (meta.key === "incidents") {
        setIncidentSync(meta);
        if (meta.status === "idle") {
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
        }
      }
      if (meta.key === "endpoints") {
        setEndpointSync(meta);
        if (meta.status === "idle") {
          queryClient.invalidateQueries({ queryKey: ["endpoints"] });
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  return { incidentSync, endpointSync };
}
