import { Severity, IncidentStatus } from "@/types/incidents";
import { EndpointStatus } from "@/types/endpoints";
import { cn } from "@/lib/utils";

const severityStyles: Record<Severity, string> = {
  critical: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  high: "bg-severity-high/10 text-severity-high border-severity-high/30",
  medium: "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
  low: "bg-severity-low/10 text-severity-low border-severity-low/30",
  info: "bg-severity-info/10 text-severity-info border-severity-info/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", severityStyles[severity])}>
      {severity}
    </span>
  );
}

const statusStyles: Record<IncidentStatus, string> = {
  open: "bg-severity-high/10 text-severity-high border-severity-high/30",
  investigating: "bg-primary/10 text-primary border-primary/30",
  contained: "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize", statusStyles[status])}>
      {status}
    </span>
  );
}

const endpointStatusStyles: Record<EndpointStatus, string> = {
  connected: "bg-status-online/10 text-status-online",
  disconnected: "bg-status-offline/10 text-status-offline",
  isolated: "bg-severity-critical/10 text-severity-critical",
};

export function EndpointStatusBadge({ status }: { status: EndpointStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize", endpointStatusStyles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", {
        "bg-status-online": status === "connected",
        "bg-status-offline": status === "disconnected",
        "bg-severity-critical": status === "isolated",
      })} />
      {status}
    </span>
  );
}
