import { AuditEntry } from "@/types/audit";

export const mockAuditLog: AuditEntry[] = [
  { id: "AUD-001", timestamp: "2026-02-13T08:25:00Z", user: "Sarah Chen", role: "Analyst", actionType: "isolate_endpoint", target: "WS-042 (INC-001)", status: "success", comment: "Isolating endpoint due to ransomware detection" },
  { id: "AUD-002", timestamp: "2026-02-13T08:26:00Z", user: "Sarah Chen", role: "Analyst", actionType: "quarantine_file", target: "INC-001", status: "success", comment: "Quarantined ransomware payload" },
  { id: "AUD-003", timestamp: "2026-02-13T07:35:00Z", user: "James Rodriguez", role: "Manager", actionType: "add_ioc_blocklist", target: "45.33.32.156 (INC-002)", status: "success", comment: "Added brute force source IP to blocklist" },
  { id: "AUD-004", timestamp: "2026-02-12T23:50:00Z", user: "Alex Morgan", role: "Admin", actionType: "isolate_endpoint", target: "WS-018 (INC-003)", status: "success", comment: "Contained lateral movement source" },
  { id: "AUD-005", timestamp: "2026-02-12T15:00:00Z", user: "James Rodriguez", role: "Manager", actionType: "close_incident", target: "INC-006", status: "success", comment: "Phishing campaign contained, training scheduled" },
  { id: "AUD-006", timestamp: "2026-02-12T14:45:00Z", user: "Sarah Chen", role: "Analyst", actionType: "kill_process", target: "SRV-007 (INC-004)", status: "failed", comment: "Process respawned, escalating to admin" },
  { id: "AUD-007", timestamp: "2026-02-11T10:00:00Z", user: "Alex Morgan", role: "Admin", actionType: "export_csv", target: "Incidents", status: "success", comment: "Weekly incident export" },
  { id: "AUD-008", timestamp: "2026-02-11T03:00:00Z", user: "Alex Morgan", role: "Admin", actionType: "scan_endpoint", target: "DB-PROD-01", status: "success", comment: "Full scan initiated after unauthorized access" },
  { id: "AUD-009", timestamp: "2026-02-10T17:00:00Z", user: "James Rodriguez", role: "Manager", actionType: "close_incident", target: "INC-010", status: "success", comment: "USB violation acknowledged by user" },
  { id: "AUD-010", timestamp: "2026-02-10T16:50:00Z", user: "Sarah Chen", role: "Analyst", actionType: "add_ioc_blocklist", target: "185.220.101.1 (INC-008)", status: "success", comment: "Blocked C2 server IP" },
];
