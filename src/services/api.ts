import { Incident } from "@/types/incidents";
import { Endpoint } from "@/types/endpoints";
import { AuditEntry } from "@/types/audit";
import { mockIncidents } from "@/data/mock-incidents";
import { mockEndpoints } from "@/data/mock-endpoints";
import { mockAuditLog } from "@/data/mock-audit";

// API mode toggle — switch to "real" when connecting Cortex XDR
const API_MODE: "mock" | "real" = "mock";

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ——— Incidents ———
export async function fetchIncidents(): Promise<Incident[]> {
  if (API_MODE === "mock") {
    await delay();
    return [...mockIncidents];
  }
  // Real API placeholder
  throw new Error("Real API not configured");
}

export async function fetchIncidentById(id: string): Promise<Incident | undefined> {
  if (API_MODE === "mock") {
    await delay();
    return mockIncidents.find((i) => i.id === id);
  }
  throw new Error("Real API not configured");
}

// ——— Endpoints ———
export async function fetchEndpoints(): Promise<Endpoint[]> {
  if (API_MODE === "mock") {
    await delay();
    return [...mockEndpoints];
  }
  throw new Error("Real API not configured");
}

export async function fetchEndpointById(id: string): Promise<Endpoint | undefined> {
  if (API_MODE === "mock") {
    await delay();
    return mockEndpoints.find((e) => e.id === id);
  }
  throw new Error("Real API not configured");
}

// ——— Audit ———
export async function fetchAuditLog(): Promise<AuditEntry[]> {
  if (API_MODE === "mock") {
    await delay();
    return [...mockAuditLog];
  }
  throw new Error("Real API not configured");
}

// ——— Response Actions ———
export async function executeResponseAction(
  action: string,
  target: string,
  comment: string
): Promise<{ success: boolean }> {
  if (API_MODE === "mock") {
    await delay(500);
    return { success: true };
  }
  throw new Error("Real API not configured");
}
