import { Incident, Severity, IncidentStatus, Artifact, ArtifactType, AlertSummary } from "@/types/incidents";
import { Endpoint, EndpointStatus, EndpointType } from "@/types/endpoints";
import { Alert } from "@/types/alerts";
import { AuditEntry } from "@/types/audit";
import { mockIncidents } from "@/data/mock-incidents";
import { mockEndpoints } from "@/data/mock-endpoints";
import { mockAuditLog } from "@/data/mock-audit";
import {
  getIncidents as xdrGetIncidents,
  getEndpoints as xdrGetEndpoints,
  getIncidentExtraData as xdrGetIncidentExtraData,
  type XdrIncident,
  type XdrEndpoint,
  type XdrAlert,
  type XdrAlertDetail,
} from "@/services/cortexXdrApi";

// API mode toggle — "real" uses Cortex XDR, "mock" uses local data
export const API_MODE: "mock" | "real" = "real";

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- XDR → Internal Mappers ---

function mapSeverity(xdrSeverity: string): Severity {
  const s = (xdrSeverity || "").toLowerCase();
  if (s === "critical") return "critical";
  if (s === "high") return "high";
  if (s === "medium" || s === "med") return "medium";
  if (s === "low") return "low";
  return "info";
}

function mapIncidentStatus(xdrStatus: string): IncidentStatus {
  const s = (xdrStatus || "").toLowerCase();
  if (s === "new" || s === "under_investigation") return "open";
  if (s === "in_progress" || s === "investigating") return "investigating";
  if (s === "resolved" || s.startsWith("resolved_")) return "closed";
  if (s === "contained") return "contained";
  return "open";
}

/**
 * Parse XDR host entry — the API returns hosts in "hostname:ip" format.
 * Examples: "DESKTOP-ABC:10.0.1.5", "10.200.15.228:64.227.41.39", "SRV01"
 * Returns { name, ip } where name is the hostname and ip is the address.
 */
function parseHost(raw: string): { name: string; ip: string } {
  if (!raw) return { name: "unknown", ip: "—" };
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) return { name: raw, ip: raw };
  const left = raw.slice(0, colonIdx);
  const right = raw.slice(colonIdx + 1);
  // If left looks like an IP and right looks like an IP → left is internal, right is external
  // If left is a hostname and right is an IP → name=left, ip=right
  return { name: left, ip: right || left };
}

export function mapXdrIncident(xdr: XdrIncident): Incident {
  const createdAt = new Date(xdr.creation_time);
  const date = createdAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const time = createdAt.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });

  const rawHosts = xdr.hosts || [];
  const users = xdr.users || [];
  const sources = xdr.incident_sources || [];

  // Parse each host entry to extract hostname and IP separately
  const parsedHosts = rawHosts.map(parseHost);
  const sourceHost = parsedHosts[0];
  const destHost = parsedHosts.length > 1 ? parsedHosts[1] : parsedHosts[0];

  // Collect all unique hostnames for relatedEndpoints
  const endpointNames = [...new Set(parsedHosts.map((h) => h.name))];

  const modifiedAt = xdr.modification_time
    ? new Date(xdr.modification_time).toISOString()
    : undefined;

  return {
    id: `INC-${xdr.incident_id}`,
    description: xdr.description || xdr.incident_name || "Untitled Incident",
    severity: mapSeverity(xdr.severity),
    alertCount: xdr.alert_count || 0,
    source: sourceHost?.name || "unknown",
    destination: destHost?.name || "—",
    date,
    time,
    status: mapIncidentStatus(xdr.status),
    fullDescription: xdr.manual_description || xdr.description || xdr.incident_name || "",
    relatedEndpoints: endpointNames,
    relatedUsers: users,
    alertSources: sources,
    recommendedActions: [],
    // Extended XDR fields
    assignedTo: xdr.assigned_user_pretty_name || undefined,
    assignedEmail: xdr.assigned_user_mail || undefined,
    modifiedTime: modifiedAt,
    highSeverityAlertCount: xdr.high_severity_alert_count || 0,
    hostCount: xdr.host_count || 0,
    userCount: xdr.user_count || 0,
    xdrUrl: xdr.xdr_url || undefined,
    starred: xdr.starred || false,
    score: xdr.rule_based_score ?? null,
    notes: xdr.notes ?? null,
  };
}

function mapEndpointStatus(xdrStatus: string): EndpointStatus {
  const s = (xdrStatus || "").toLowerCase();
  if (s === "connected") return "connected";
  if (s === "isolated") return "isolated";
  if (s === "lost") return "lost";
  if (s === "uninstalled") return "uninstalled";
  return "disconnected";
}

function mapEndpointType(xdr: XdrEndpoint): EndpointType {
  const t = (xdr.endpoint_type || "").toLowerCase();
  if (t.includes("server")) return "server";
  if (t.includes("laptop")) return "laptop";
  if (t.includes("virtual") || t.includes("vm")) return "virtual";
  return "workstation";
}

export function mapXdrEndpoint(xdr: XdrEndpoint): Endpoint {
  const lastSeenDate = xdr.last_seen
    ? new Date(xdr.last_seen).toISOString()
    : new Date().toISOString();
  const ips = Array.isArray(xdr.ip) ? xdr.ip : xdr.ip ? [xdr.ip] : [];

  return {
    id: xdr.endpoint_id,
    name: xdr.endpoint_name || xdr.alias || "Unknown",
    type: mapEndpointType(xdr),
    status: mapEndpointStatus(xdr.endpoint_status),
    os: (xdr.operating_system as string) || xdr.os_type || "Unknown",
    agentVersion: xdr.endpoint_version || "—",
    ip: ips[0] || xdr.public_ip || "—",
    username: (xdr.users || []).join(", ") || "—",
    lastSeen: lastSeenDate,
    contentStatus: (xdr.content_status as string) || undefined,
    operationalStatus: (xdr.operational_status as string) || undefined,
    scanStatus: (xdr.scan_status as string) || undefined,
    assignedPolicy: (xdr.assigned_prevention_policy as string) || undefined,
    groupName: (xdr.group_name as string[]) || undefined,
    firstSeen: xdr.first_seen ? new Date(xdr.first_seen).toISOString() : undefined,
    installDate: (xdr.install_date as number) ? new Date(xdr.install_date as number).toISOString() : undefined,
    macAddress: (xdr.mac_address as string[]) || undefined,
    domain: xdr.domain || undefined,
    publicIp: xdr.public_ip || undefined,
    isIsolated: xdr.is_isolated === "AGENT_ISOLATED",
  };
}

// ——— Alerts ———

export function mapXdrAlert(xdr: XdrAlert): Alert {
  const ts = xdr.detection_timestamp
    ? new Date(xdr.detection_timestamp).toISOString()
    : new Date().toISOString();

  return {
    id: String(xdr.alert_id),
    name: xdr.name || "Unnamed Alert",
    severity: mapSeverity(xdr.severity),
    category: xdr.category || "Unknown",
    description: xdr.description || "",
    hostIp: xdr.host_ip || "—",
    hostName: xdr.host_name || "—",
    source: xdr.source || "Unknown",
    action: xdr.action || "—",
    actionPretty: xdr.action_pretty || xdr.action || "—",
    timestamp: ts,
  };
}

// ——— Incident Extra Data (artifacts from alerts) ———

function extractArtifactsFromAlerts(alerts: XdrAlertDetail[]): Artifact[] {
  const seen = new Set<string>();
  const artifacts: Artifact[] = [];

  function add(type: ArtifactType, value: string, description?: string, isMalicious?: boolean) {
    const key = `${type}:${value}`;
    if (seen.has(key) || !value) return;
    seen.add(key);
    artifacts.push({ id: `art-${artifacts.length + 1}`, type, value, description, isMalicious });
  }

  for (const a of alerts) {
    // File hashes (SHA-256)
    if (a.action_file_sha256) {
      add("hash", a.action_file_sha256, `File: ${a.action_file_name || a.action_file_path || "unknown"}`, true);
    }
    if (a.action_process_image_sha256) {
      add("hash", a.action_process_image_sha256, `Process: ${a.action_process_image_name || "unknown"}`, true);
    }
    if (a.actor_process_image_sha256 && a.actor_process_image_sha256 !== a.action_process_image_sha256) {
      add("hash", a.actor_process_image_sha256, `Parent Process: ${a.actor_process_image_name || "unknown"}`);
    }
    if (a.causality_actor_process_image_sha256 && a.causality_actor_process_image_sha256 !== a.actor_process_image_sha256) {
      add("hash", a.causality_actor_process_image_sha256, `Causality Process: ${a.causality_actor_process_image_name || "unknown"}`);
    }

    // MD5 (secondary hash)
    if (a.action_file_md5) {
      add("hash", a.action_file_md5, `MD5: ${a.action_file_name || "unknown"}`);
    }

    // File paths
    if (a.action_file_path) {
      add("file", a.action_file_path, `Action file in alert: ${a.name || ""}`, true);
    }

    // Process names as files
    if (a.action_process_image_name) {
      add("file", a.action_process_image_name, `Process executed — ${a.action_process_command_line || ""}`);
    }
    if (a.actor_process_image_name && a.actor_process_image_name !== a.action_process_image_name) {
      add("file", a.actor_process_image_name, `Parent process — ${a.actor_process_command_line || ""}`);
    }

    // IP addresses
    if (a.action_remote_ip) {
      add("ip", a.action_remote_ip, `Remote connection${a.action_remote_port ? ` port ${a.action_remote_port}` : ""}`);
    }
    if (a.action_local_ip && a.action_local_ip !== a.host_ip) {
      add("ip", a.action_local_ip, "Local IP");
    }

    // DNS / domains
    if (a.dns_query_name) {
      add("domain", a.dns_query_name, "DNS query");
    }

    // Registry
    if (a.action_registry_key_name) {
      add("registry", a.action_registry_key_name, a.action_registry_value_name || "Registry modification");
    }
  }

  return artifacts;
}

function mapAlertDetailToSummary(a: XdrAlertDetail): AlertSummary {
  return {
    id: String(a.alert_id),
    name: a.name || "Unnamed Alert",
    severity: mapSeverity(a.severity),
    timestamp: a.detection_timestamp
      ? new Date(a.detection_timestamp).toISOString()
      : new Date().toISOString(),
  };
}

/**
 * Fetch incident extra data (detailed alerts + artifacts) from XDR API.
 * Returns enriched Incident with artifacts and alert summaries populated.
 */
export async function fetchIncidentExtraData(
  incidentId: string,
): Promise<{ artifacts: Artifact[]; alerts: AlertSummary[] } | null> {
  if (API_MODE === "mock") return null;
  try {
    const numericId = incidentId.replace(/^INC-/, "");
    const extra = await xdrGetIncidentExtraData(numericId);
    const alertDetails = extra.alerts?.data ?? [];
    return {
      artifacts: extractArtifactsFromAlerts(alertDetails),
      alerts: alertDetails.map(mapAlertDetailToSummary),
    };
  } catch (err) {
    console.error("XDR incident extra data failed:", err);
    return null;
  }
}

// ——— Incidents ———

export async function fetchIncidents(): Promise<Incident[]> {
  if (API_MODE === "mock") {
    await delay();
    return [...mockIncidents];
  }
  try {
    // XDR API limits search_size to <100 per request — paginate in batches
    const PAGE_SIZE = 100;
    const MAX_PAGES = 5; // up to 500 incidents total
    const allIncidents: Incident[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const result = await xdrGetIncidents([], from, to);
      allIncidents.push(...result.incidents.map(mapXdrIncident));
      // Stop if we got fewer results than the page size (no more data)
      if (result.incidents.length < PAGE_SIZE) break;
    }

    return allIncidents;
  } catch (err) {
    console.error("XDR incidents fetch failed, falling back to mock:", err);
    return [...mockIncidents];
  }
}

export async function fetchIncidentById(id: string): Promise<Incident | undefined> {
  if (API_MODE === "mock") {
    await delay();
    return mockIncidents.find((i) => i.id === id);
  }
  try {
    const numericId = id.replace(/^INC-/, "");
    const result = await xdrGetIncidents(
      [{ field: "incident_id_list", operator: "in", value: [numericId] }],
      0,
      1,
    );
    if (result.incidents.length > 0) {
      return mapXdrIncident(result.incidents[0]);
    }
    return mockIncidents.find((i) => i.id === id);
  } catch (err) {
    console.error("XDR incident detail failed, falling back to mock:", err);
    return mockIncidents.find((i) => i.id === id);
  }
}

// ——— Endpoints ———

export async function fetchEndpoints(): Promise<Endpoint[]> {
  if (API_MODE === "mock") {
    await delay();
    return [...mockEndpoints];
  }
  try {
    const result = await xdrGetEndpoints([], 0, 100);
    return result.endpoints.map(mapXdrEndpoint);
  } catch (err) {
    console.error("XDR endpoints fetch failed, falling back to mock:", err);
    return [...mockEndpoints];
  }
}

export async function fetchEndpointById(id: string): Promise<Endpoint | undefined> {
  if (API_MODE === "mock") {
    await delay();
    return mockEndpoints.find((e) => e.id === id);
  }
  try {
    const result = await xdrGetEndpoints(
      [{ field: "endpoint_id_list", operator: "in", value: [id] }],
      0,
      1,
    );
    if (result.endpoints.length > 0) {
      return mapXdrEndpoint(result.endpoints[0]);
    }
    return mockEndpoints.find((e) => e.id === id);
  } catch (err) {
    console.error("XDR endpoint detail failed, falling back to mock:", err);
    return mockEndpoints.find((e) => e.id === id);
  }
}

// ——— Audit ———
export async function fetchAuditLog(): Promise<AuditEntry[]> {
  await delay();
  return [...mockAuditLog];
}

// ——— Response Actions ———
export async function executeResponseAction(
  action: string,
  target: string,
  comment: string,
): Promise<{ success: boolean }> {
  await delay(500);
  return { success: true };
}
