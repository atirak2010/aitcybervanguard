import { Incident, Severity, IncidentStatus } from "@/types/incidents";
import { Endpoint, EndpointStatus, EndpointType } from "@/types/endpoints";
import { AuditEntry } from "@/types/audit";
import { mockIncidents } from "@/data/mock-incidents";
import { mockEndpoints } from "@/data/mock-endpoints";
import { mockAuditLog } from "@/data/mock-audit";
import {
  getIncidents as xdrGetIncidents,
  getEndpoints as xdrGetEndpoints,
  type XdrIncident,
  type XdrEndpoint,
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
    os: xdr.os_type || "Unknown",
    agentVersion: xdr.endpoint_version || "—",
    ip: ips[0] || xdr.public_ip || "—",
    username: (xdr.users || []).join(", ") || "—",
    lastSeen: lastSeenDate,
  };
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
