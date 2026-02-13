import type { Severity } from "./incidents";

export interface Alert {
  id: string;
  name: string;
  severity: Severity;
  category: string;
  description: string;
  hostIp: string;
  hostName: string;
  source: string;
  action: string;
  actionPretty: string;
  timestamp: string;
  incidentId?: string;
}
