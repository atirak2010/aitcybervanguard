export type EndpointStatus = "connected" | "disconnected" | "isolated";
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
}
