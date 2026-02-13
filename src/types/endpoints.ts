export type EndpointStatus = "connected" | "disconnected" | "isolated" | "lost" | "uninstalled";
export type EndpointType = "workstation" | "server" | "laptop" | "virtual";

export interface Endpoint {
  id: string;
  name: string;
  type: EndpointType;
  status: EndpointStatus;
  os: string;
  agentVersion: string;
  ip: string;
  username: string;
  lastSeen: string;
  relatedIncidentIds?: string[];
  // Health fields
  contentStatus?: string;
  operationalStatus?: string;
  scanStatus?: string;
  assignedPolicy?: string;
  groupName?: string[];
  firstSeen?: string;
  installDate?: string;
  macAddress?: string[];
  // Network / identity fields
  domain?: string;
  publicIp?: string;
  isIsolated?: boolean;
}
