import { useSyncStatus } from "@/hooks/useSyncStatus";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function SyncStatusIndicator() {
  const { incidentSync, endpointSync } = useSyncStatus();

  const isSyncing =
    incidentSync?.status === "syncing" || endpointSync?.status === "syncing";
  const hasError =
    incidentSync?.status === "error" || endpointSync?.status === "error";

  const lastSync = Math.max(
    incidentSync?.lastSyncedAt ?? 0,
    endpointSync?.lastSyncedAt ?? 0,
  );
  const lastSyncText = lastSync
    ? new Date(lastSync).toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
        hour12: false,
      })
    : "Never";

  const incidentCount = incidentSync?.syncedCount ?? 0;
  const endpointCount = endpointSync?.syncedCount ?? 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          {isSyncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : hasError ? (
            <AlertCircle className="h-3.5 w-3.5 text-severity-high" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 text-status-online" />
          )}
          <span className="hidden sm:inline">
            {isSyncing ? "Syncing..." : `Synced ${lastSyncText}`}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <p>Incidents cached: {incidentCount}</p>
          <p>Endpoints cached: {endpointCount}</p>
          <p>Last sync: {lastSyncText}</p>
          {hasError && (
            <p className="text-severity-high">
              {incidentSync?.errorMessage || endpointSync?.errorMessage}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
