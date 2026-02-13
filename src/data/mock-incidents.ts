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
    alertSources: ["XDR Agent", "Email Security"],
    artifacts: [
      { id: "ART-001", type: "hash", value: "e99a18c428cb38d5f260853678922e03", description: "MD5 hash of ransomware payload", isMalicious: true },
      { id: "ART-002", type: "hash", value: "5d41402abc4b2a76b9719d911017c592f3a2b8c1", description: "SHA1 hash of dropper executable", isMalicious: true },
      { id: "ART-003", type: "file", value: "C:\\Users\\john.doe\\Downloads\\invoice_2026.pdf.exe", description: "Malicious attachment disguised as PDF", isMalicious: true },
      { id: "ART-004", type: "domain", value: "evil-payload.darknet.io", description: "C2 callback domain", isMalicious: true },
      { id: "ART-005", type: "email", value: "billing@fake-invoice.com", description: "Phishing sender address", isMalicious: true },
      { id: "ART-006", type: "registry", value: "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\WannaUpdate", description: "Persistence registry key", isMalicious: true },
    ],
    assets: [
      { hostname: "WS-042", ip: "192.168.1.42", os: "Windows 11 Pro", type: "workstation", owner: "john.doe", role: "Victim endpoint" },
      { hostname: "MAIL-SRV", ip: "192.168.1.10", os: "Windows Server 2022", type: "server", owner: "IT-Ops", role: "Email gateway (delivery path)" },
    ],
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
    alertSources: ["Firewall", "Analytics BIOC"],
    artifacts: [
      { id: "ART-007", type: "ip", value: "45.33.32.156", description: "Attacking source IP (Linode scanner)", isMalicious: true },
      { id: "ART-008", type: "url", value: "https://45.33.32.156/brute/rdp", description: "Brute force tool callback URL", isMalicious: true },
    ],
    assets: [
      { hostname: "DC-001", ip: "10.0.1.1", os: "Windows Server 2022", type: "server", owner: "IT-Infra", role: "Primary Domain Controller (target)" },
    ],
  },
  {
    id: "INC-003", description: "Lateral movement detected via SMB", severity: "critical", alertCount: 15,
    source: "WS-018", destination: "FS-002", date: "2026-02-12", time: "23:45:30", status: "contained",
    fullDescription: "Suspicious lateral movement detected from workstation WS-018 to file server FS-002 using SMB protocol. Multiple files accessed in rapid succession.",
    relatedEndpoints: ["WS-018", "FS-002"], relatedUsers: ["m.johnson"], recommendedActions: ["Verify user activity", "Check accessed files", "Scan both endpoints"],
    alertSources: ["XDR Agent", "Analytics"],
    artifacts: [
      { id: "ART-009", type: "file", value: "\\\\FS-002\\finance\\payroll_2026.xlsx", description: "Accessed sensitive file", isMalicious: false },
      { id: "ART-010", type: "file", value: "\\\\FS-002\\hr\\employee_records.csv", description: "Accessed sensitive file", isMalicious: false },
      { id: "ART-011", type: "hash", value: "7c4a8d09ca3762af61e59520943dc26494f8941b", description: "PsExec hash used for lateral movement", isMalicious: true },
    ],
    assets: [
      { hostname: "WS-018", ip: "192.168.1.18", os: "Windows 10 Enterprise", type: "workstation", owner: "m.johnson", role: "Source of lateral movement" },
      { hostname: "FS-002", ip: "192.168.2.50", os: "Windows Server 2019", type: "server", owner: "IT-Ops", role: "Target file server" },
    ],
  },
  {
    id: "INC-004", description: "Suspicious PowerShell execution on server", severity: "medium", alertCount: 3,
    source: "SRV-007", destination: "SRV-007", date: "2026-02-12", time: "14:30:00", status: "open",
    fullDescription: "Encoded PowerShell command detected on server SRV-007. Command attempts to download and execute payload from external server.",
    relatedEndpoints: ["SRV-007"], relatedUsers: ["svc_account"], recommendedActions: ["Kill suspicious process", "Analyze PowerShell command", "Check service account permissions"],
    alertSources: ["XDR Agent"],
    artifacts: [
      { id: "ART-012", type: "file", value: "C:\\Windows\\Temp\\update.ps1", description: "Malicious PowerShell script", isMalicious: true },
      { id: "ART-013", type: "url", value: "http://203.0.113.50/payload.bin", description: "Payload download URL", isMalicious: true },
      { id: "ART-014", type: "domain", value: "cdn-update.malware-host.net", description: "Staging domain for payload", isMalicious: true },
    ],
    assets: [
      { hostname: "SRV-007", ip: "10.0.3.7", os: "Windows Server 2019", type: "server", owner: "App-Team", role: "Application server (compromised)" },
    ],
  },
  {
    id: "INC-005", description: "Data exfiltration attempt via DNS tunneling", severity: "high", alertCount: 6,
    source: "WS-031", destination: "8.8.4.4", date: "2026-02-12", time: "11:20:00", status: "open",
    fullDescription: "DNS tunneling activity detected from WS-031. Large volume of DNS queries to suspicious domain with encoded data payloads.",
    relatedEndpoints: ["WS-031"], relatedUsers: ["r.smith"], recommendedActions: ["Block suspicious DNS domain", "Isolate endpoint", "Analyze DNS query logs"],
    alertSources: ["NGFW", "Analytics"],
    artifacts: [
      { id: "ART-015", type: "domain", value: "data-xfil.tunnel-dns.com", description: "DNS tunneling domain", isMalicious: true },
      { id: "ART-016", type: "ip", value: "8.8.4.4", description: "DNS resolver used for tunneling", isMalicious: false },
      { id: "ART-017", type: "file", value: "C:\\ProgramData\\dnscat2.exe", description: "DNS tunneling tool", isMalicious: true },
    ],
    assets: [
      { hostname: "WS-031", ip: "192.168.1.31", os: "Windows 10 Enterprise", type: "workstation", owner: "r.smith", role: "Compromised endpoint (exfiltration source)" },
    ],
  },
  {
    id: "INC-006", description: "Phishing campaign targeting finance department", severity: "medium", alertCount: 4,
    source: "external", destination: "finance-group", date: "2026-02-11", time: "09:00:00", status: "closed",
    relatedEndpoints: ["WS-055", "WS-056", "WS-057"], relatedUsers: ["finance-team"], recommendedActions: ["Security awareness training", "Update email filters"],
    alertSources: ["Email Security"],
    artifacts: [
      { id: "ART-018", type: "email", value: "accounts@secure-banking-update.com", description: "Phishing sender address", isMalicious: true },
      { id: "ART-019", type: "url", value: "https://secure-banking-update.com/login", description: "Credential harvesting page", isMalicious: true },
      { id: "ART-020", type: "domain", value: "secure-banking-update.com", description: "Phishing domain", isMalicious: true },
    ],
    assets: [
      { hostname: "WS-055", ip: "192.168.3.55", os: "Windows 11 Pro", type: "workstation", owner: "finance-user1", role: "Received phishing email" },
      { hostname: "WS-056", ip: "192.168.3.56", os: "Windows 11 Pro", type: "workstation", owner: "finance-user2", role: "Clicked phishing link" },
      { hostname: "WS-057", ip: "192.168.3.57", os: "Windows 11 Pro", type: "workstation", owner: "finance-user3", role: "Received phishing email" },
    ],
  },
  {
    id: "INC-007", description: "Unauthorized access to sensitive database", severity: "critical", alertCount: 9,
    source: "10.0.5.22", destination: "DB-PROD-01", date: "2026-02-11", time: "02:15:00", status: "investigating",
    relatedEndpoints: ["DB-PROD-01"], relatedUsers: ["unknown"], recommendedActions: ["Revoke suspicious sessions", "Audit database access logs", "Check for data leakage"],
    alertSources: ["Analytics BIOC", "3rd Party SIEM"],
    artifacts: [
      { id: "ART-021", type: "ip", value: "10.0.5.22", description: "Unauthorized source IP", isMalicious: true },
      { id: "ART-022", type: "url", value: "jdbc:mysql://DB-PROD-01:3306/customers", description: "Targeted database connection string", isMalicious: false },
      { id: "ART-023", type: "file", value: "/tmp/sqlmap_output.txt", description: "SQL injection tool output file", isMalicious: true },
    ],
    assets: [
      { hostname: "DB-PROD-01", ip: "10.0.4.10", os: "Ubuntu 22.04 LTS", type: "server", owner: "DBA-Team", role: "Production database (target)" },
    ],
  },
  {
    id: "INC-008", description: "Malware beaconing to C2 server", severity: "high", alertCount: 5,
    source: "WS-099", destination: "185.220.101.1", date: "2026-02-10", time: "16:45:00", status: "contained",
    relatedEndpoints: ["WS-099"], relatedUsers: ["t.wilson"], recommendedActions: ["Block C2 IP", "Quarantine malware", "Full endpoint scan"],
    alertSources: ["XDR Agent", "Firewall"],
    artifacts: [
      { id: "ART-024", type: "ip", value: "185.220.101.1", description: "C2 server IP (Tor exit node, Germany)", isMalicious: true },
      { id: "ART-025", type: "hash", value: "a3f5b2c1d4e6f7890123456789abcdef", description: "MD5 hash of beacon malware", isMalicious: true },
      { id: "ART-026", type: "file", value: "C:\\Users\\t.wilson\\AppData\\Local\\svchost_update.exe", description: "Disguised malware binary", isMalicious: true },
      { id: "ART-027", type: "domain", value: "c2-beacon.darkops.net", description: "C2 callback domain", isMalicious: true },
    ],
    assets: [
      { hostname: "WS-099", ip: "192.168.5.99", os: "Windows 10 Enterprise", type: "workstation", owner: "t.wilson", role: "Infected endpoint (beaconing)" },
    ],
  },
  {
    id: "INC-009", description: "Privilege escalation attempt on Linux server", severity: "medium", alertCount: 2,
    source: "LNX-003", destination: "LNX-003", date: "2026-02-10", time: "13:00:00", status: "open",
    relatedEndpoints: ["LNX-003"], relatedUsers: ["dev_user"], recommendedActions: ["Review sudo logs", "Check kernel exploit signatures"],
    alertSources: ["XDR Agent"],
  },
  {
    id: "INC-010", description: "USB device policy violation", severity: "low", alertCount: 1,
    source: "WS-072", destination: "WS-072", date: "2026-02-10", time: "10:30:00", status: "closed",
    relatedEndpoints: ["WS-072"], relatedUsers: ["a.williams"], recommendedActions: ["Remind user of USB policy"],
    alertSources: ["XDR Agent"],
  },
  {
    id: "INC-011", description: "Cryptominer detected on virtual machine", severity: "medium", alertCount: 4,
    source: "VM-DEV-12", destination: "mining-pool.com", date: "2026-02-09", time: "22:00:00", status: "contained",
    relatedEndpoints: ["VM-DEV-12"], relatedUsers: ["dev_ops"], recommendedActions: ["Remove cryptominer", "Patch VM", "Review access controls"],
    alertSources: ["XDR Agent", "Cloud Security"],
  },
  {
    id: "INC-012", description: "Suspicious VPN login from unusual location", severity: "low", alertCount: 1,
    source: "vpn-gateway", destination: "corporate-net", date: "2026-02-09", time: "03:30:00", status: "closed",
    relatedEndpoints: [], relatedUsers: ["j.chen"], recommendedActions: ["Verify with user", "Enable MFA if not set"],
    alertSources: ["IAM", "Analytics"],
  },
];
