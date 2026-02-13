import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  testConnection,
  getIncidents,
  getEndpoints,
  getAuthMode,
  setAuthMode,
  type ConnectionTestResult,
  type AuthMode,
  type XdrIncident,
  type XdrEndpoint,
} from "@/services/cortexXdrApi";
import { Wifi, WifiOff, Loader2, Server, Shield, AlertTriangle, Monitor, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SettingsPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [authMode, setAuthModeLocal] = useState<AuthMode>(getAuthMode());

  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [xdrIncidents, setXdrIncidents] = useState<XdrIncident[] | null>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);

  const [loadingEndpoints, setLoadingEndpoints] = useState(false);
  const [xdrEndpoints, setXdrEndpoints] = useState<XdrEndpoint[] | null>(null);
  const [endpointError, setEndpointError] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await testConnection();
      setResult(r);
    } catch {
      setResult({ success: false, message: "Unexpected error" });
    }
    setTesting(false);
  };

  const handleAuthChange = (mode: AuthMode) => {
    setAuthModeLocal(mode);
    setAuthMode(mode);
    setResult(null);
  };

  const handleFetchIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentError(null);
    try {
      const data = await getIncidents([], 0, 10);
      setXdrIncidents(data.incidents);
    } catch (err) {
      setIncidentError(err instanceof Error ? err.message : "Failed to fetch incidents");
    }
    setLoadingIncidents(false);
  };

  const handleFetchEndpoints = async () => {
    setLoadingEndpoints(true);
    setEndpointError(null);
    try {
      const data = await getEndpoints([], 0, 10);
      setXdrEndpoints(data.endpoints);
    } catch (err) {
      setEndpointError(err instanceof Error ? err.message : "Failed to fetch endpoints");
    }
    setLoadingEndpoints(false);
  };

  const apiUrl = import.meta.env.VITE_CORTEX_XDR_API_URL || "Not configured";
  const apiKeyId = import.meta.env.VITE_CORTEX_XDR_API_KEY_ID || "Not configured";
  const apiKeyPreview = import.meta.env.VITE_CORTEX_XDR_API_KEY
    ? `${import.meta.env.VITE_CORTEX_XDR_API_KEY.slice(0, 8)}${"*".repeat(20)}`
    : "Not configured";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Cortex XDR API Connection</p>
      </div>

      {/* Connection Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4" /> API Configuration
          </CardTitle>
          <CardDescription>Credentials loaded from .env file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">API URL</p>
              <p className="mt-0.5 text-sm font-mono break-all">{apiUrl}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">API Key ID</p>
              <p className="mt-0.5 text-sm font-mono">{apiKeyId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">API Key</p>
              <p className="mt-0.5 text-sm font-mono">{apiKeyPreview}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Auth Mode</p>
              <Select value={authMode} onValueChange={(v) => handleAuthChange(v as AuthMode)}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="advanced">Advanced (HMAC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Connection Test
          </CardTitle>
          <CardDescription>Test connectivity to Cortex XDR API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleTest} disabled={testing}>
            {testing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              <><Wifi className="mr-2 h-4 w-4" /> Test Connection</>
            )}
          </Button>

          {result && (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                result.success
                  ? "border-status-online/30 bg-status-online/5"
                  : "border-severity-critical/30 bg-severity-critical/5"
              }`}
            >
              {result.success ? (
                <Wifi className="mt-0.5 h-5 w-5 text-status-online shrink-0" />
              ) : (
                <WifiOff className="mt-0.5 h-5 w-5 text-severity-critical shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {result.success ? "Connection Successful" : "Connection Failed"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{result.message}</p>
                {result.incidentCount !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total incidents in Cortex XDR: <span className="font-semibold text-foreground">{result.incidentCount}</span>
                  </p>
                )}
                {result.latencyMs !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Latency: <span className="font-semibold text-foreground">{result.latencyMs}ms</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fetch Live Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" /> Live Incidents (from Cortex XDR)
          </CardTitle>
          <CardDescription>Fetch real incidents from the API (latest 10)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleFetchIncidents} disabled={loadingIncidents}>
            {loadingIncidents ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Fetch Incidents</>
            )}
          </Button>

          {incidentError && (
            <p className="text-sm text-severity-critical">{incidentError}</p>
          )}

          {xdrIncidents && xdrIncidents.length === 0 && (
            <p className="text-sm text-muted-foreground">No incidents found.</p>
          )}

          {xdrIncidents && xdrIncidents.length > 0 && (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Alerts</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xdrIncidents.map((inc) => (
                    <TableRow key={inc.incident_id}>
                      <TableCell className="font-mono text-xs">{inc.incident_id}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{inc.description || inc.incident_name}</TableCell>
                      <TableCell>
                        <Badge variant={inc.severity === "high" || inc.severity === "critical" ? "destructive" : "secondary"} className="text-xs capitalize">
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{inc.status}</TableCell>
                      <TableCell className="text-center">{inc.alert_count}</TableCell>
                      <TableCell className="text-xs">{new Date(inc.creation_time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fetch Live Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" /> Live Endpoints (from Cortex XDR)
          </CardTitle>
          <CardDescription>Fetch real endpoints from the API (latest 10)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleFetchEndpoints} disabled={loadingEndpoints}>
            {loadingEndpoints ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Fetch Endpoints</>
            )}
          </Button>

          {endpointError && (
            <p className="text-sm text-severity-critical">{endpointError}</p>
          )}

          {xdrEndpoints && xdrEndpoints.length === 0 && (
            <p className="text-sm text-muted-foreground">No endpoints found.</p>
          )}

          {xdrEndpoints && xdrEndpoints.length > 0 && (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Isolated</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {xdrEndpoints.map((ep) => (
                    <TableRow key={ep.endpoint_id}>
                      <TableCell className="font-mono text-sm">{ep.endpoint_name || ep.alias}</TableCell>
                      <TableCell className="font-mono text-xs">{Array.isArray(ep.ip) ? ep.ip.join(", ") : ep.ip}</TableCell>
                      <TableCell className="text-xs">{ep.os_type}</TableCell>
                      <TableCell>
                        <Badge variant={ep.endpoint_status === "connected" ? "default" : "secondary"} className="text-xs capitalize">
                          {ep.endpoint_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{ep.is_isolated}</TableCell>
                      <TableCell className="text-xs">{new Date(ep.last_seen).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
