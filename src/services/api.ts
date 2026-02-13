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

function mapXdrIncident(xdr: XdrIncident): Incident {
  const createdAt = new Date(xdr.creation_time);
  const date = createdAt.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  const time = createdAt.toLocaleTimeString("en-GB", { timeZone: "Asia/Bangkok", hour12: false });

  const hosts = xdr.hosts || [];
  const users = xdr.users || [];
  const sources = xdr.incident_sources || [];

  return {
    id: `INC-${xdr.incident_id}`,
    description: xdr.description || xdr.incident_name || "Untitled Incident",
    severity: mapSeverity(xdr.severity),
    alertCount: xdr.alert_count || 0,
    source: hosts[0] || "unknown",
    destination: hosts.length > 1 ? hosts[1] : hosts[0] || "—",
    date,
    time,
    status: mapIncidentStatus(xdr.status),
    fullDescription: xdr.manual_description || xdr.description || xdr.incident_name || "",
    relatedEndpoints: hosts,
    relatedUsers: users,
    alertSources: sources,
    recommendedActions: [],
  };
}

function mapEndpointStatus(xdrStatus: string): EndpointStatus {
  const s = (xdrStatus || "").toLowerCase();
  if (s === "connected") return "connected";
  if (s === "isolated") return "isolated";
  return "disconnected";
}

function mapEndpointType(xdr: XdrEndpoint): EndpointType {
  const t = (xdr.endpoint_type || "").toLowerCase();
  if (t.includes("server")) return "server";
  if (t.includes("laptop")) return "laptop";
  if (t.includes("virtual") || t.includes("vm")) return "virtual";
  return "workstation";
}

function mapXdrEndpoint(xdr: XdrEndpoint): Endpoint {
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
    const result = await xdrGetIncidents([], 0, 100);
    return result.incidents.map(mapXdrIncident);
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
