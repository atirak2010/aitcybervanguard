import { useState, useMemo } from "react";
import { mockEndpoints } from "@/data/mock-endpoints";
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
import { Search, Shield, ScanSearch, Settings, Eye } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function EndpointsPage() {
  const { hasPermission } = useAuth();
  const { addAuditEntry } = useAudit();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [osFilter, setOsFilter] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: string; target: string } | null>(null);
  const [comment, setComment] = useState("");

  const osList = useMemo(() => [...new Set(mockEndpoints.map((e) => e.os))], []);

  const filtered = useMemo(() => {
    let list = [...mockEndpoints];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.ip.includes(q) || e.username.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
    if (osFilter !== "all") list = list.filter((e) => e.os === osFilter);
    return list;
  }, [search, statusFilter, osFilter]);

  const selected = selectedEndpoint ? mockEndpoints.find((e) => e.id === selectedEndpoint) : null;

  const executeAction = (type: string, target: string) => {
    addAuditEntry(type as any, target, "success", comment || "Action executed");
    setActionDialog(null);
    setComment("");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Endpoints</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} endpoints</p>
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
              <SelectItem value="isolated">Isolated</SelectItem>
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
                    <TableCell className="font-mono text-xs">{ep.ip}</TableCell>
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
                  <TableRow><TableCell colSpan={9} className="py-8 text-center text-muted-foreground">No endpoints match your filters.</TableCell></TableRow>
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
                <div className="flex justify-between"><span className="text-muted-foreground">IP</span><span className="font-mono">{selected.ip}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">User</span><span>{selected.username}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Last Seen</span><span>{formatDateTime(selected.lastSeen)}</span></div>
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
