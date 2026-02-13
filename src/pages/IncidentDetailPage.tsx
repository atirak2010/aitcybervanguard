import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncidentById } from "@/hooks/useIncidents";
import { ArtifactType } from "@/types/incidents";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, Skull, FileX, Ban, CheckCircle, FileText, Globe, Link, Hash, Mail, Database, Monitor, Server, Laptop, Network, Loader2 } from "lucide-react";
import { formatDateTime, getFlagUrl, getCountryName } from "@/lib/utils";

const ARTIFACT_ICON: Record<ArtifactType, typeof FileText> = {
  file: FileText,
  ip: Globe,
  domain: Globe,
  url: Link,
  hash: Hash,
  registry: Database,
  email: Mail,
};

const ASSET_ICON: Record<string, typeof Monitor> = {
  workstation: Laptop,
  server: Server,
  vm: Monitor,
  network: Network,
  other: Monitor,
};

const responseActions = [
  { id: "isolate_endpoint", label: "Isolate Endpoint", icon: Shield, permission: "endpointActions" as const },
  { id: "kill_process", label: "Kill Process", icon: Skull, permission: "endpointActions" as const },
  { id: "quarantine_file", label: "Quarantine File", icon: FileX, permission: "investigateIncidents" as const },
  { id: "add_ioc_blocklist", label: "Add to IOC Blocklist", icon: Ban, permission: "investigateIncidents" as const },
  { id: "close_incident", label: "Close Incident", icon: CheckCircle, permission: "closeIncidents" as const },
] as const;

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { addAuditEntry } = useAudit();

  const { data: incident, isLoading: loading } = useIncidentById(id);
  const [actionComment, setActionComment] = useState("");
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading incident details...</span>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-muted-foreground">Incident not found</p>
        <Button variant="outline" onClick={() => navigate("/incidents")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Incidents
        </Button>
      </div>
    );
  }

  const handleAction = () => {
    if (!activeAction) return;
    addAuditEntry(activeAction as any, `${incident.id}`, "success", actionComment || "Action executed");
    setDialogOpen(false);
    setActionComment("");
    setActiveAction(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/incidents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{incident.id}</h1>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{incident.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Main Detail */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Full Description</CardTitle></CardHeader>
            <CardContent><p className="text-sm leading-relaxed">{incident.fullDescription || incident.description}</p></CardContent>
          </Card>

          {/* Alert Summary */}
          {incident.alerts && incident.alerts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Alert Summary ({incident.alerts.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {incident.alerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-sm">{a.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDateTime(a.timestamp)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {incident.timeline && incident.timeline.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-0 before:h-full before:w-px before:bg-border">
                  {incident.timeline.map((e, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-[18px] h-3 w-3 rounded-full border-2 border-card ${e.type === "alert" ? "bg-severity-critical" : e.type === "action" ? "bg-primary" : "bg-muted-foreground"}`} />
                      <p className="text-sm">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(e.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Artifacts */}
          {incident.artifacts && incident.artifacts.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Artifacts ({incident.artifacts.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incident.artifacts.map((art) => {
                      const Icon = ARTIFACT_ICON[art.type] || FileText;
                      const flagUrl = art.type === "ip" ? getFlagUrl(art.value) : null;
                      const country = art.type === "ip" ? getCountryName(art.value) : "";
                      return (
                        <TableRow key={art.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs capitalize">{art.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] font-mono text-xs break-all">
                            {art.value}
                            {flagUrl && <img src={flagUrl} alt={country} title={country} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{art.description || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={art.isMalicious ? "destructive" : "secondary"} className="text-xs">
                              {art.isMalicious ? "Malicious" : "Benign"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Assets */}
          {incident.assets && incident.assets.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Assets ({incident.assets.length})</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostname</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incident.assets.map((asset) => {
                      const Icon = ASSET_ICON[asset.type] || Monitor;
                      return (
                        <TableRow key={asset.hostname}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{asset.hostname}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {asset.ip}
                            {getFlagUrl(asset.ip) && <img src={getFlagUrl(asset.ip)!} alt={getCountryName(asset.ip)} title={getCountryName(asset.ip)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}
                          </TableCell>
                          <TableCell className="text-xs">{asset.os || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs capitalize">{asset.type}</Badge></TableCell>
                          <TableCell className="text-xs">{asset.owner || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{asset.role || "—"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Source</span><span className="font-mono">{incident.source}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span className="font-mono">{incident.destination}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{incident.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{incident.time}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Alerts</span><span>{incident.alertCount}</span></div>
            </CardContent>
          </Card>

          {incident.relatedEndpoints && incident.relatedEndpoints.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Related Endpoints</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {incident.relatedEndpoints.map((ep) => <Badge key={ep} variant="secondary">{ep}</Badge>)}
              </CardContent>
            </Card>
          )}

          {incident.relatedUsers && incident.relatedUsers.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Related Users</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {incident.relatedUsers.map((u) => <Badge key={u} variant="outline">{u}</Badge>)}
              </CardContent>
            </Card>
          )}

          {incident.recommendedActions && incident.recommendedActions.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Recommended Actions</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {incident.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Response Actions */}
          <Card>
            <CardHeader><CardTitle className="text-base">Response Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {responseActions.map((action) => {
                if (!hasPermission(action.permission)) return null;
                return (
                  <Dialog key={action.id} open={dialogOpen && activeAction === action.id} onOpenChange={(open) => { setDialogOpen(open); if (!open) setActiveAction(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setActiveAction(action.id)}>
                        <action.icon className="h-4 w-4" /> {action.label}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm: {action.label}</DialogTitle>
                        <DialogDescription>This action will be logged in the audit trail. Target: {incident.id}</DialogDescription>
                      </DialogHeader>
                      <Textarea placeholder="Add a comment…" value={actionComment} onChange={(e) => setActionComment(e.target.value)} />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAction}>Confirm</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
