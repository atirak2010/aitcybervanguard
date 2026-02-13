import { Incident } from "@/types/incidents";

export const mockIncidents: Incident[] = [
  {
    id: "INC-001", description: "Ransomware detected on endpoint WS-042", severity: "critical", alertCount: 12,
    source: "192.168.1.105", destination: "WS-042", date: "2026-02-13", time: "08:23:15", status: "open",
    fullDescription: "Ransomware variant WannaCry 3.0 detected on workstation WS-042. Multiple encryption attempts blocked by Cortex XDR agent. The malware was delivered via a phishing email attachment.",
    alerts: [
      { id: "ALT-001", name: "Malicious File Detected", severity: "critical", timestamp: "2026-02-13T08:23:15Z" },
      { id: "ALT-002", name: "Encryption Attempt Blocked", severity: "critical", timestamp: "2026-02-13T08:23:18Z" },
      { id: "ALT-003", name: "Suspicious Registry Modification", severity: "high", timestamp: "2026-02-13T08:23:20Z" },
    ],
    timeline: [
      { timestamp: "2026-02-13T08:20:00Z", description: "Phishing email received", type: "alert" },
      { timestamp: "2026-02-13T08:22:45Z", description: "Attachment opened by user", type: "alert" },
      { timestamp: "2026-02-13T08:23:15Z", description: "Ransomware payload detected", type: "alert" },
      { timestamp: "2026-02-13T08:23:18Z", description: "Encryption attempt blocked by agent", type: "system" },
    ],
    relatedEndpoints: ["WS-042"], relatedUsers: ["john.doe"], recommendedActions: ["Isolate endpoint WS-042", "Quarantine malicious file", "Reset user credentials", "Scan adjacent endpoints"],
  },
  {
    id: "INC-002", description: "Brute force login attempts from external IP", severity: "high", alertCount: 8,
    source: "45.33.32.156", destination: "DC-001", date: "2026-02-13", time: "07:15:42", status: "investigating",
    fullDescription: "Multiple failed login attempts detected from external IP 45.33.32.156 targeting Domain Controller DC-001. Over 500 attempts in 10 minutes.",
    alerts: [
      { id: "ALT-004", name: "Multiple Failed Logins", severity: "high", timestamp: "2026-02-13T07:15:42Z" },
      { id: "ALT-005", name: "Suspicious External IP", severity: "medium", timestamp: "2026-02-13T07:16:00Z" },
    ],
    timeline: [
      { timestamp: "2026-02-13T07:15:42Z", description: "First failed login detected", type: "alert" },
      { timestamp: "2026-02-13T07:25:00Z", description: "500+ attempts threshold reached", type: "alert" },
      { timestamp: "2026-02-13T07:30:00Z", description: "Investigation started by analyst", type: "action" },
    ],
    relatedEndpoints: ["DC-001"], relatedUsers: ["admin"], recommendedActions: ["Block source IP at firewall", "Check for compromised credentials", "Review recent successful logins"],
  },
  {
    id: "INC-003", description: "Lateral movement detected via SMB", severity: "critical", alertCount: 15,
    source: "WS-018", destination: "FS-002", date: "2026-02-12", time: "23:45:30", status: "contained",
    fullDescription: "Suspicious lateral movement detected from workstation WS-018 to file server FS-002 using SMB protocol. Multiple files accessed in rapid succession.",
    relatedEndpoints: ["WS-018", "FS-002"], relatedUsers: ["m.johnson"], recommendedActions: ["Verify user activity", "Check accessed files", "Scan both endpoints"],
  },
  {
    id: "INC-004", description: "Suspicious PowerShell execution on server", severity: "medium", alertCount: 3,
    source: "SRV-007", destination: "SRV-007", date: "2026-02-12", time: "14:30:00", status: "open",
    fullDescription: "Encoded PowerShell command detected on server SRV-007. Command attempts to download and execute payload from external server.",
    relatedEndpoints: ["SRV-007"], relatedUsers: ["svc_account"], recommendedActions: ["Kill suspicious process", "Analyze PowerShell command", "Check service account permissions"],
  },
  {
    id: "INC-005", description: "Data exfiltration attempt via DNS tunneling", severity: "high", alertCount: 6,
    source: "WS-031", destination: "8.8.4.4", date: "2026-02-12", time: "11:20:00", status: "open",
    fullDescription: "DNS tunneling activity detected from WS-031. Large volume of DNS queries to suspicious domain with encoded data payloads.",
    relatedEndpoints: ["WS-031"], relatedUsers: ["r.smith"], recommendedActions: ["Block suspicious DNS domain", "Isolate endpoint", "Analyze DNS query logs"],
  },
  {
    id: "INC-006", description: "Phishing campaign targeting finance department", severity: "medium", alertCount: 4,
    source: "external", destination: "finance-group", date: "2026-02-11", time: "09:00:00", status: "closed",
    relatedEndpoints: ["WS-055", "WS-056", "WS-057"], relatedUsers: ["finance-team"], recommendedActions: ["Security awareness training", "Update email filters"],
  },
  {
    id: "INC-007", description: "Unauthorized access to sensitive database", severity: "critical", alertCount: 9,
    source: "10.0.5.22", destination: "DB-PROD-01", date: "2026-02-11", time: "02:15:00", status: "investigating",
    relatedEndpoints: ["DB-PROD-01"], relatedUsers: ["unknown"], recommendedActions: ["Revoke suspicious sessions", "Audit database access logs", "Check for data leakage"],
  },
  {
    id: "INC-008", description: "Malware beaconing to C2 server", severity: "high", alertCount: 5,
    source: "WS-099", destination: "185.220.101.1", date: "2026-02-10", time: "16:45:00", status: "contained",
    relatedEndpoints: ["WS-099"], relatedUsers: ["t.wilson"], recommendedActions: ["Block C2 IP", "Quarantine malware", "Full endpoint scan"],
  },
  {
    id: "INC-009", description: "Privilege escalation attempt on Linux server", severity: "medium", alertCount: 2,
    source: "LNX-003", destination: "LNX-003", date: "2026-02-10", time: "13:00:00", status: "open",
    relatedEndpoints: ["LNX-003"], relatedUsers: ["dev_user"], recommendedActions: ["Review sudo logs", "Check kernel exploit signatures"],
  },
  {
    id: "INC-010", description: "USB device policy violation", severity: "low", alertCount: 1,
    source: "WS-072", destination: "WS-072", date: "2026-02-10", time: "10:30:00", status: "closed",
    relatedEndpoints: ["WS-072"], relatedUsers: ["a.williams"], recommendedActions: ["Remind user of USB policy"],
  },
  {
    id: "INC-011", description: "Cryptominer detected on virtual machine", severity: "medium", alertCount: 4,
    source: "VM-DEV-12", destination: "mining-pool.com", date: "2026-02-09", time: "22:00:00", status: "contained",
    relatedEndpoints: ["VM-DEV-12"], relatedUsers: ["dev_ops"], recommendedActions: ["Remove cryptominer", "Patch VM", "Review access controls"],
  },
  {
    id: "INC-012", description: "Suspicious VPN login from unusual location", severity: "low", alertCount: 1,
    source: "vpn-gateway", destination: "corporate-net", date: "2026-02-09", time: "03:30:00", status: "closed",
    relatedEndpoints: [], relatedUsers: ["j.chen"], recommendedActions: ["Verify with user", "Enable MFA if not set"],
  },
];
