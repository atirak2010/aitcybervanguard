import { useState, useMemo } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuth } from "@/contexts/AuthContext";
import { Incident, Severity, IncidentStatus } from "@/types/incidents";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, ArrowUpDown, Loader2, Star, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFlagUrl, getCountryName } from "@/lib/utils";

export default function IncidentsPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const { data: incidents = [], isLoading: loading } = useIncidents();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [alertSourceFilter, setAlertSourceFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Incident>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const alertSourceList = useMemo(() => {
    const sources = new Set<string>();
    incidents.forEach((i) => i.alertSources?.forEach((s) => sources.add(s)));
    return [...sources].sort();
  }, [incidents]);

  const filtered = useMemo(() => {
    let list = [...incidents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.id.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (severityFilter !== "all") list = list.filter((i) => i.severity === severityFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (alertSourceFilter !== "all") list = list.filter((i) => i.alertSources?.includes(alertSourceFilter));
    list.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [search, severityFilter, statusFilter, alertSourceFilter, sortField, sortDir, incidents]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: keyof Incident) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const exportCsv = () => {
    const headers = ["Incident ID", "Description", "Severity", "Alerts Count", "High Alerts", "Source", "Destination", "User", "Assigned To", "Alert Sources", "Hosts", "Score", "Date", "Time", "Status", "Starred", "XDR URL"];
    const rows = filtered.map((i) => [i.id, `"${i.description}"`, i.severity, i.alertCount, i.highSeverityAlertCount ?? "", i.source, i.destination, `"${i.relatedUsers?.join("; ") || ""}"`, `"${i.assignedTo || ""}"`, `"${i.alertSources?.join("; ") || ""}"`, i.hostCount ?? "", i.score ?? "", i.date, i.time, i.status, i.starred ? "Yes" : "", i.xdrUrl || ""]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents_export_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading incidents from Cortex XDR...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Incidents</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} incidents found</p>
        </div>
        {hasPermission("exportCsv") && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by ID or keyword…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {(["critical", "high", "medium", "low", "info"] as Severity[]).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(["open", "investigating", "contained", "closed"] as IncidentStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={alertSourceFilter} onValueChange={(v) => { setAlertSourceFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Alert Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Alert Sources</SelectItem>
              {alertSourceList.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("id")}>ID <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("severity")}>Severity <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Alert Sources</TableHead>
                <TableHead className="text-center">Hosts</TableHead>
                <TableHead className="cursor-pointer text-center" onClick={() => toggleSort("score")}>Score <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>Date <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="w-8 px-2">
                    {i.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm" title={i.description}>{i.description}</TableCell>
                  <TableCell><SeverityBadge severity={i.severity} /></TableCell>
                  <TableCell>
                    <span>{i.alertCount}</span>
                    {(i.highSeverityAlertCount ?? 0) > 0 && (
                      <span className="ml-1 text-[10px] text-severity-high" title="High severity alerts">({i.highSeverityAlertCount}H)</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{i.source}{getFlagUrl(i.source) && <img src={getFlagUrl(i.source)!} alt={getCountryName(i.source)} title={getCountryName(i.source)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}</TableCell>
                  <TableCell className="font-mono text-xs">{i.destination}{getFlagUrl(i.destination) && <img src={getFlagUrl(i.destination)!} alt={getCountryName(i.destination)} title={getCountryName(i.destination)} className="ml-1 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}</TableCell>
                  <TableCell className="text-xs">{i.relatedUsers?.join(", ") || "—"}</TableCell>
                  <TableCell className="text-xs">{i.assignedTo || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {i.alertSources?.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>) || <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-xs">{i.hostCount || "—"}</TableCell>
                  <TableCell className="text-center">
                    {i.score != null ? (
                      <Badge variant={i.score >= 70 ? "destructive" : i.score >= 40 ? "default" : "secondary"} className="text-xs">{i.score}</Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{i.date} {i.time.slice(0, 5)}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/incidents/${i.id}`)}>
                        <Eye className="mr-1 h-3 w-3" /> Investigate
                      </Button>
                      {i.xdrUrl && (
                        <Button size="sm" variant="ghost" className="px-2" onClick={() => window.open(i.xdrUrl, "_blank")} title="Open in Cortex XDR">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={15} className="py-8 text-center text-muted-foreground">No incidents match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
