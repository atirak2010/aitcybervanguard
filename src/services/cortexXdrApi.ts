/**
 * Cortex XDR API Service
 *
 * Connects to Palo Alto Cortex XDR via the Vite dev-server proxy (/api/xdr)
 * to avoid CORS. Supports both Standard and Advanced API key authentication.
 */

const API_KEY_ID = import.meta.env.VITE_CORTEX_XDR_API_KEY_ID ?? "";
const API_KEY = import.meta.env.VITE_CORTEX_XDR_API_KEY ?? "";

// Proxy base — requests go to /api/xdr which Vite proxies to the real XDR URL
const BASE = "/api/xdr";

// --- Auth helpers ---------------------------------------------------

/** Generate a cryptographically random 64-char alphanumeric nonce */
function generateNonce(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

/** SHA-256 hex digest via Web Crypto API */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build headers for Standard API key auth */
function standardHeaders(): Record<string, string> {
  return {
    "x-xdr-auth-id": API_KEY_ID,
    "Authorization": API_KEY,
    "Content-Type": "application/json",
  };
}

/** Build headers for Advanced API key auth (hashed nonce + timestamp) */
async function advancedHeaders(): Promise<Record<string, string>> {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();
  const authHash = await sha256Hex(`${API_KEY}${nonce}${timestamp}`);
  return {
    "x-xdr-auth-id": API_KEY_ID,
    "x-xdr-nonce": nonce,
    "x-xdr-timestamp": timestamp,
    "Authorization": authHash,
    "Content-Type": "application/json",
  };
}

// --- Core request ---------------------------------------------------

export type AuthMode = "standard" | "advanced";

let authMode: AuthMode = "standard";

export function setAuthMode(mode: AuthMode) {
  authMode = mode;
}

export function getAuthMode(): AuthMode {
  return authMode;
}

async function xdrFetch<T>(path: string, body: unknown): Promise<T> {
  const headers =
    authMode === "advanced" ? await advancedHeaders() : standardHeaders();

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`XDR API ${res.status}: ${text}`);
  }

  return res.json();
}

// --- Types ----------------------------------------------------------

export interface XdrFilter {
  field: string;
  operator: "in" | "gte" | "lte" | "eq" | "neq" | "contains";
  value: string | number | string[] | number[];
}

interface RequestData {
  filters?: XdrFilter[];
  search_from?: number;
  search_to?: number;
  sort?: { field: string; keyword: "asc" | "desc" };
}

export interface XdrIncident {
  incident_id: string;
  incident_name: string;
  creation_time: number;
  modification_time: number;
  status: string;
  severity: string;
  description: string;
  assigned_user_mail: string | null;
  assigned_user_pretty_name: string | null;
  alert_count: number;
  high_severity_alert_count: number;
  host_count: number;
  user_count: number;
  notes: string | null;
  xdr_url: string;
  starred: boolean;
  hosts: string[];
  users: string[];
  incident_sources: string[];
  rule_based_score: number | null;
  manual_severity: string | null;
  manual_description: string | null;
  [key: string]: unknown;
}

export interface XdrEndpoint {
  endpoint_id: string;
  endpoint_name: string;
  endpoint_type: string;
  endpoint_status: string;
  os_type: string;
  ip: string[];
  public_ip: string;
  domain: string;
  alias: string;
  first_seen: number;
  last_seen: number;
  users: string[];
  endpoint_version: string;
  is_isolated: string;
  group_name: string[];
  operational_status: string;
  [key: string]: unknown;
}

export interface XdrAlert {
  alert_id: string;
  name: string;
  severity: string;
  category: string;
  description: string;
  host_ip: string;
  host_name: string;
  source: string;
  action: string;
  action_pretty: string;
  detection_timestamp: number;
  [key: string]: unknown;
}

// --- API Endpoints --------------------------------------------------

export async function getIncidents(
  filters?: XdrFilter[],
  from = 0,
  to = 100,
): Promise<{ total_count: number; incidents: XdrIncident[] }> {
  const body: { request_data: RequestData } = {
    request_data: {
      filters,
      search_from: from,
      search_to: to,
      sort: { field: "creation_time", keyword: "desc" },
    },
  };
  const data = await xdrFetch<{
    reply: { total_count: number; result_count: number; incidents: XdrIncident[] };
  }>("/public_api/v1/incidents/get_incidents/", body);
  return {
    total_count: data.reply.total_count,
    incidents: data.reply.incidents ?? [],
  };
}

export async function getEndpoints(
  filters?: XdrFilter[],
  from = 0,
  to = 100,
): Promise<{ total_count: number; endpoints: XdrEndpoint[] }> {
  const body: { request_data: RequestData } = {
    request_data: {
      filters,
      search_from: from,
      search_to: to,
      sort: { field: "last_seen", keyword: "desc" },
    },
  };
  const data = await xdrFetch<{
    reply: { total_count: number; result_count: number; endpoints: XdrEndpoint[] };
  }>("/public_api/v1/endpoints/get_endpoint/", body);
  return {
    total_count: data.reply.total_count,
    endpoints: data.reply.endpoints ?? [],
  };
}

export async function getAlerts(
  filters?: XdrFilter[],
  from = 0,
  to = 100,
): Promise<{ total_count: number; alerts: XdrAlert[] }> {
  const body: { request_data: RequestData } = {
    request_data: {
      filters,
      search_from: from,
      search_to: to,
      sort: { field: "creation_time", keyword: "desc" },
    },
  };
  const data = await xdrFetch<{
    reply: { total_count: number; result_count: number; alerts: XdrAlert[] };
  }>("/public_api/v1/alerts/get_alerts_multi_events/", body);
  return {
    total_count: data.reply.total_count,
    alerts: data.reply.alerts ?? [],
  };
}

// --- Connection Test ------------------------------------------------

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  incidentCount?: number;
  endpointCount?: number;
  latencyMs?: number;
}

export async function testConnection(): Promise<ConnectionTestResult> {
  const start = performance.now();
  try {
    // Try to fetch incidents with a minimal request
    const result = await getIncidents([], 0, 1);
    const latency = Math.round(performance.now() - start);
    return {
      success: true,
      message: `Connected successfully (${latency}ms)`,
      incidentCount: result.total_count,
      latencyMs: latency,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - start);

    // If Standard auth fails, try Advanced
    if (authMode === "standard") {
      try {
        setAuthMode("advanced");
        const result = await getIncidents([], 0, 1);
        const latency2 = Math.round(performance.now() - start);
        return {
          success: true,
          message: `Connected with Advanced auth (${latency2}ms)`,
          incidentCount: result.total_count,
          latencyMs: latency2,
        };
      } catch {
        setAuthMode("standard");
      }
    }

    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
      latencyMs: latency,
    };
  }
}
