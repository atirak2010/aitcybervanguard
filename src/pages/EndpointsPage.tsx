import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useEndpoints } from "@/hooks/useEndpoints";
import { Endpoint } from "@/types/endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { EndpointStatusBadge } from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Shield, ScanSearch, Settings, Eye, Loader2, Wifi, WifiOff, ShieldCheck, ShieldAlert, Lock } from "lucide-react";
import { formatDate, formatDateTime, getFlagUrl, getCountryName } from "@/lib/utils";

export default function EndpointsPage() {
  const { hasPermission } = useAuth();
  const { addAuditEntry } = useAudit();
  const { data: allEndpoints = [], isLoading: loading } = useEndpoints();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [osFilter, setOsFilter] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; target: string } | null>(null);
  const [comment, setComment] = useState("");

  const osList = useMemo(() => [...new Set(allEndpoints.map((e) => e.os))], [allEndpoints]);

  const filtered = useMemo(() => {
    let list = [...allEndpoints];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.ip.includes(q) || e.username.toLowerCase().includes(q) || (e.domain || "").toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (osFilter !== "all") list = list.filter((e) => e.os === osFilter);
    return list;
  }, [search, statusFilter, osFilter, allEndpoints]);

  const selected = selectedEndpoint ? allEndpoints.find((e) => e.id === selectedEndpoint) : null;

  const executeAction = (type: string, target: string) => {
    addAuditEntry(type as any, target, "success", comment || "Action executed");
    setActionDialog(null);
    setComment("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading endpoints from Cortex XDR...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Endpoints</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} endpoints</p>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-online/10">
              <Wifi className="h-5 w-5 text-status-online" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connected</p>
              <p className="text-xl font-bold text-status-online">{allEndpoints.filter((e) => e.status === "connected").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-offline/10">
              <WifiOff className="h-5 w-5 text-status-offline" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disconnected</p>
              <p className="text-xl font-bold">{allEndpoints.filter((e) => e.status === "disconnected").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-online/10">
              <ShieldCheck className="h-5 w-5 text-status-online" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Protected</p>
              <p className="text-xl font-bold text-status-online">{allEndpoints.filter((e) => e.operationalStatus === "PROTECTED").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-severity-medium/10">
              <ShieldAlert className="h-5 w-5 text-severity-medium" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Content Outdated</p>
              <p className="text-xl font-bold text-severity-medium">{allEndpoints.filter((e) => e.contentStatus && e.contentStatus !== "UP_TO_DATE").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, IP, or user…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="disconnected">Disconnected</SelectItem>
              <SelectItem value="lost">Connection Lost</SelectItem>
              <SelectItem value="isolated">Isolated</SelectItem>
              <SelectItem value="uninstalled">Uninstalled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={osFilter} onValueChange={setOsFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="OS" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All OS</SelectItem>
              {osList.map((os) => <SelectItem key={os} value={os}>{os}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Table */}
        <Card className={selected ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ep) => (
                  <TableRow key={ep.id} className={selectedEndpoint === ep.id ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{ep.name}</TableCell>
                    <TableCell className="capitalize text-xs">{ep.type}</TableCell>
                    <TableCell><EndpointStatusBadge status={ep.status} /></TableCell>
                    <TableCell className="text-xs">{ep.os}</TableCell>
                    <TableCell className="font-mono text-xs">{ep.agentVersion}</TableCell>
                    <TableCell className="font-mono text-xs">{ep.ip}{getFlagUrl(ep.ip) && <img src={getFlagUrl(ep.ip)!} alt={getCountryName(ep.ip)} title={getCountryName(ep.ip)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}</TableCell>
                    <TableCell className="text-xs">{ep.domain || "—"}</TableCell>
                    <TableCell className="text-xs">{ep.username}</TableCell>
                    <TableCell className="text-xs">{formatDate(ep.lastSeen)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedEndpoint(ep.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No endpoints match your filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selected && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {selected.name}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEndpoint(null)}>×</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><EndpointStatusBadge status={selected.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{selected.type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">OS</span><span>{selected.os}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Agent</span><span className="font-mono">{selected.agentVersion}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono">{selected.ip}{getFlagUrl(selected.ip) && <img src={getFlagUrl(selected.ip)!} alt={getCountryName(selected.ip)} title={getCountryName(selected.ip)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}</span></div>
                {selected.publicIp && selected.publicIp !== selected.ip && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Public IP</span><span className="font-mono">{selected.publicIp}{getFlagUrl(selected.publicIp) && <img src={getFlagUrl(selected.publicIp)!} alt={getCountryName(selected.publicIp)} title={getCountryName(selected.publicIp)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}</span></div>
                )}
                {selected.domain && <div className="flex justify-between"><span className="text-muted-foreground">Domain</span><span className="text-xs">{selected.domain}</span></div>}
                {selected.isIsolated && (
                  <div className="flex items-center gap-1.5 text-severity-critical">
                    <Lock className="h-3.5 w-3.5" /> Endpoint Isolated
                  </div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">User</span><span>{selected.username}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last Seen</span><span>{formatDateTime(selected.lastSeen)}</span></div>
                {selected.assignedPolicy && <div className="flex justify-between"><span className="text-muted-foreground">Policy</span><span className="text-xs">{selected.assignedPolicy}</span></div>}
                {selected.operationalStatus && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Protection</span>
                    <Badge variant={selected.operationalStatus === "PROTECTED" ? "default" : "destructive"} className="text-xs">
                      {selected.operationalStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
                {selected.contentStatus && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Content</span>
                    <Badge variant={selected.contentStatus === "UP_TO_DATE" ? "secondary" : "destructive"} className="text-xs">
                      {selected.contentStatus.replace(/_/g, " ")}
                    </Badge>
                  </div>
                )}
                {selected.scanStatus && <div className="flex justify-between"><span className="text-muted-foreground">Scan</span><span className="text-xs">{selected.scanStatus.replace(/SCAN_STATUS_/g, "").replace(/_/g, " ")}</span></div>}
                {selected.groupName && selected.groupName.length > 0 && <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Group</span><span className="text-xs text-right">{selected.groupName.join(", ")}</span></div>}
                {selected.macAddress && selected.macAddress.length > 0 && <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono text-xs">{selected.macAddress[0]}</span></div>}
                {selected.firstSeen && <div className="flex justify-between"><span className="text-muted-foreground">First Seen</span><span className="text-xs">{formatDateTime(selected.firstSeen)}</span></div>}
              </CardContent>
            </Card>

            {selected.relatedIncidentIds && selected.relatedIncidentIds.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Related Incidents</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {selected.relatedIncidentIds.map((id) => <Badge key={id} variant="secondary">{id}</Badge>)}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {hasPermission("endpointActions") && (
              <Card>
                <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <Dialog open={!!actionDialog} onOpenChange={(o) => { if (!o) setActionDialog(null); }}>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActionDialog({ type: "isolate_endpoint", target: selected.name })}>
                      <Shield className="h-4 w-4" /> Isolate Endpoint
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActionDialog({ type: "scan_endpoint", target: selected.name })}>
                      <ScanSearch className="h-4 w-4" /> Scan Endpoint
                    </Button>
                    {hasPermission("advancedEndpointActions") && (
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActionDialog({ type: "kill_process", target: selected.name })}>
                        <Settings className="h-4 w-4" /> Advanced Actions
                      </Button>
                    )}
                    {actionDialog && (
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm: {actionDialog.type.replace(/_/g, " ")}</DialogTitle>
                          <DialogDescription>Target: {actionDialog.target}</DialogDescription>
                        </DialogHeader>
                        <Textarea placeholder="Comment…" value={comment} onChange={(e) => setComment(e.target.value)} />
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
                          <Button onClick={() => executeAction(actionDialog.type, actionDialog.target)}>Confirm</Button>
                        </DialogFooter>
                      </DialogContent>
                    )}
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
