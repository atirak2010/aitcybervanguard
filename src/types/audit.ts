export type ActionType =
  | "isolate_endpoint"
  | "kill_process"
  | "quarantine_file"
  | "add_ioc_blocklist"
  | "close_incident"
  | "scan_endpoint"
  | "login"
  | "export_csv";

export type AuditStatus = "success" | "failed" | "pending";

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  actionType: ActionType;
  target: string;
  status: AuditStatus;
  comment: string;
}
