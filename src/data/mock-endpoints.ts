import { Endpoint } from "@/types/endpoints";

export const mockEndpoints: Endpoint[] = [
  { id: "EP-001", name: "WS-042", type: "workstation", status: "isolated", os: "Windows 11 Pro", agentVersion: "8.2.1", ip: "192.168.1.105", username: "john.doe", lastSeen: "2026-02-13T08:23:15Z", relatedIncidentIds: ["INC-001"] },
  { id: "EP-002", name: "DC-001", type: "server", status: "connected", os: "Windows Server 2022", agentVersion: "8.2.1", ip: "10.0.0.1", username: "SYSTEM", lastSeen: "2026-02-13T09:00:00Z", relatedIncidentIds: ["INC-002"] },
  { id: "EP-003", name: "WS-018", type: "workstation", status: "connected", os: "Windows 10 Enterprise", agentVersion: "8.2.0", ip: "192.168.1.18", username: "m.johnson", lastSeen: "2026-02-13T08:50:00Z", relatedIncidentIds: ["INC-003"] },
  { id: "EP-004", name: "FS-002", type: "server", status: "connected", os: "Windows Server 2019", agentVersion: "8.1.5", ip: "10.0.1.5", username: "SYSTEM", lastSeen: "2026-02-13T09:01:00Z", relatedIncidentIds: ["INC-003"] },
  { id: "EP-005", name: "SRV-007", type: "server", status: "connected", os: "Windows Server 2022", agentVersion: "8.2.1", ip: "10.0.2.7", username: "svc_account", lastSeen: "2026-02-13T08:55:00Z", relatedIncidentIds: ["INC-004"] },
  { id: "EP-006", name: "WS-031", type: "workstation", status: "connected", os: "Windows 11 Pro", agentVersion: "8.2.1", ip: "192.168.1.31", username: "r.smith", lastSeen: "2026-02-13T08:45:00Z", relatedIncidentIds: ["INC-005"] },
  { id: "EP-007", name: "WS-055", type: "workstation", status: "connected", os: "Windows 10 Enterprise", agentVersion: "8.2.0", ip: "192.168.2.55", username: "l.martinez", lastSeen: "2026-02-13T08:30:00Z", relatedIncidentIds: ["INC-006"] },
  { id: "EP-008", name: "DB-PROD-01", type: "server", status: "connected", os: "Ubuntu 22.04 LTS", agentVersion: "8.2.1", ip: "10.0.5.10", username: "db_admin", lastSeen: "2026-02-13T09:00:00Z", relatedIncidentIds: ["INC-007"] },
  { id: "EP-009", name: "WS-099", type: "workstation", status: "isolated", os: "Windows 11 Pro", agentVersion: "8.2.1", ip: "192.168.3.99", username: "t.wilson", lastSeen: "2026-02-12T16:45:00Z", relatedIncidentIds: ["INC-008"] },
  { id: "EP-010", name: "LNX-003", type: "server", status: "connected", os: "CentOS 8", agentVersion: "8.1.8", ip: "10.0.3.3", username: "dev_user", lastSeen: "2026-02-13T08:00:00Z", relatedIncidentIds: ["INC-009"] },
  { id: "EP-011", name: "WS-072", type: "laptop", status: "connected", os: "Windows 10 Pro", agentVersion: "8.2.0", ip: "192.168.4.72", username: "a.williams", lastSeen: "2026-02-13T08:40:00Z", relatedIncidentIds: ["INC-010"] },
  { id: "EP-012", name: "VM-DEV-12", type: "virtual", status: "connected", os: "Ubuntu 20.04 LTS", agentVersion: "8.1.5", ip: "172.16.0.12", username: "dev_ops", lastSeen: "2026-02-13T07:00:00Z", relatedIncidentIds: ["INC-011"] },
  { id: "EP-013", name: "WS-001", type: "workstation", status: "connected", os: "macOS Ventura", agentVersion: "8.2.1", ip: "192.168.1.1", username: "ceo", lastSeen: "2026-02-13T09:05:00Z" },
  { id: "EP-014", name: "SRV-MAIL", type: "server", status: "connected", os: "Windows Server 2022", agentVersion: "8.2.1", ip: "10.0.0.25", username: "SYSTEM", lastSeen: "2026-02-13T09:02:00Z" },
  { id: "EP-015", name: "WS-LAP-05", type: "laptop", status: "disconnected", os: "Windows 11 Pro", agentVersion: "8.1.9", ip: "192.168.5.5", username: "remote_user", lastSeen: "2026-02-10T17:00:00Z" },
];
