export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type IncidentStatus = "open" | "investigating" | "contained" | "closed";

export interface Incident {
  id: string;
  description: string;
  severity: Severity;
  alertCount: number;
  source: string;
  destination: string;
  date: string;
  time: string;
  status: IncidentStatus;
  fullDescription?: string;
  alerts?: AlertSummary[];
  timeline?: TimelineEvent[];
  relatedEndpoints?: string[];
  relatedUsers?: string[];
  recommendedActions?: string[];
}

export interface AlertSummary {
  id: string;
  name: string;
  severity: Severity;
  timestamp: string;
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
  type: "alert" | "action" | "system";
}
