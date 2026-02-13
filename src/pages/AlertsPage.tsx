import { useState, useMemo } from "react";
import { useAlerts } from "@/hooks/useAlerts";
import { SeverityBadge } from "@/components/StatusBadges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, ArrowUpDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACTION_COLORS: Record<string, string> = {
  "BLOCKED": "bg-status-online/10 text-status-online",
  "DETECTED": "bg-severity-medium/10 text-severity-medium",
  "REPORTED": "bg-severity-info/10 text-severity-info",
  "PREVENTED": "bg-status-online/10 text-status-online",
};

export default function AlertsPage() {
  const navigate = useNavigate();
  const { data: alerts = [], isLoading: loading } = useAlerts();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField, setSortField] = useState<"timestamp" | "severity">("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const categories = useMemo(() => [...new Set(alerts.map((a) => a.category))].sort(), [alerts]);
  const actions = useMemo(() => [...new Set(alerts.map((a) => a.action))].sort(), [alerts]);
  const sources = useMemo(() => [...new Set(alerts.map((a) => a.source))].sort(), [alerts]);

  const filtered = useMemo(() => {
    let list = [...alerts];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.name.toLowerCase().includes(q) ||
        a.hostName.toLowerCase().includes(q) ||
        a.hostIp.includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    if (severityFilter !== "all") list = list.filter((a) => a.severity === severityFilter);
    if (categoryFilter !== "all") list = list.filter((a) => a.category === categoryFilter);
    if (actionFilter !== "all") list = list.filter((a) => a.action === actionFilter);
    if (sourceFilter !== "all") list = list.filter((a) => a.source === sourceFilter);
    list.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [search, severityFilter, categoryFilter, actionFilter, sourceFilter, sortField, sortDir, alerts]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: "timestamp" | "severity") => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading alerts from Cortex XDR...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} alerts found</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, host, IP…" className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              {["critical", "high", "medium", "low", "info"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                <TableHead>Alert Name</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("severity")}>Severity <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("timestamp")}>Timestamp <ArrowUpDown className="ml-1 inline h-3 w-3" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-[250px] truncate text-sm font-medium">{a.name}</TableCell>
                  <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{a.category}</Badge></TableCell>
                  <TableCell className="text-xs">
                    <span className="font-mono">{a.hostName}</span>
                    {a.hostIp !== "—" && a.hostIp !== a.hostName && (
                      <span className="ml-1 text-muted-foreground">({a.hostIp})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${ACTION_COLORS[a.action.toUpperCase()] || "bg-muted text-muted-foreground"}`}>
                      {a.actionPretty}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{a.source}</Badge></TableCell>
                  <TableCell className="text-xs">
                    {new Date(a.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                  </TableCell>
                </TableRow>
              ))}
              {paged.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No alerts match your filters.</TableCell></TableRow>
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
