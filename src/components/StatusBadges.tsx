import { Severity, IncidentStatus } from "@/types/incidents";
import { EndpointStatus } from "@/types/endpoints";
import { cn } from "@/lib/utils";

const severityStyles: Record<Severity, string> = {
  critical: "bg-severity-critical/15 text-severity-critical border-severity-critical/30 shadow-sm shadow-severity-critical/10",
  high: "bg-severity-high/15 text-severity-high border-severity-high/30 shadow-sm shadow-severity-high/10",
  medium: "bg-severity-medium/15 text-severity-medium border-severity-medium/30 shadow-sm shadow-severity-medium/10",
  low: "bg-severity-low/15 text-severity-low border-severity-low/30 shadow-sm shadow-severity-low/10",
  info: "bg-severity-info/15 text-severity-info border-severity-info/30",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize backdrop-blur-sm", severityStyles[severity])}>
      {severity}
    </span>
  );
}

const statusStyles: Record<IncidentStatus, string> = {
  open: "bg-severity-high/15 text-severity-high border-severity-high/30 shadow-sm shadow-severity-high/10",
  investigating: "bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/10",
  contained: "bg-severity-medium/15 text-severity-medium border-severity-medium/30 shadow-sm shadow-severity-medium/10",
  closed: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize backdrop-blur-sm", statusStyles[status])}>
      {status}
    </span>
  );
}

const endpointStatusStyles: Record<EndpointStatus, string> = {
  connected: "bg-status-online/15 text-status-online",
  disconnected: "bg-status-offline/15 text-status-offline",
  isolated: "bg-severity-critical/15 text-severity-critical",
};

export function EndpointStatusBadge({ status }: { status: EndpointStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", endpointStatusStyles[status])}>
      <span className={cn("h-2 w-2 rounded-full animate-pulse", {
        "bg-status-online shadow-sm shadow-status-online/50": status === "connected",
        "bg-status-offline": status === "disconnected",
        "bg-severity-critical shadow-sm shadow-severity-critical/50": status === "isolated",
      })} />
      {status}
    </span>
  );
}
