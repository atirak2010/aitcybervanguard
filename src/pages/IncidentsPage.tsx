import { useState, useMemo } from "react";
import { mockIncidents } from "@/data/mock-incidents";
import { useAuth } from "@/contexts/AuthContext";
import { Incident, Severity, IncidentStatus } from "@/types/incidents";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Eye, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function IncidentsPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Incident>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    let list = [...mockIncidents];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.id.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (severityFilter !== "all") list = list.filter((i) => i.severity === severityFilter);
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    list.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [search, severityFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: keyof Incident) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const exportCsv = () => {
    const headers = ["Incident ID", "Description", "Severity", "Alerts Count", "Source", "Destination", "Date", "Time", "Status"];
    const rows = filtered.map((i) => [i.id, `"${i.description}"`, i.severity, i.alertCount, i.source, i.destination, i.date, i.time, i.status]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents_export_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("id")}>ID <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("severity")}>Severity <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>Date <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.id}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">{i.description}</TableCell>
                  <TableCell><SeverityBadge severity={i.severity} /></TableCell>
                  <TableCell>{i.alertCount}</TableCell>
                  <TableCell className="font-mono text-xs">{i.source}</TableCell>
                  <TableCell className="font-mono text-xs">{i.destination}</TableCell>
                  <TableCell className="text-xs">{i.relatedUsers?.join(", ") || "—"}</TableCell>
                  <TableCell className="text-xs">{i.date} {i.time.slice(0, 5)}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/incidents/${i.id}`)}>
                      <Eye className="mr-1 h-3 w-3" /> Investigate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No incidents match your filters.</TableCell></TableRow>
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
