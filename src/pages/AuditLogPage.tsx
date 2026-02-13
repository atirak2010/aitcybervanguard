import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAudit } from "@/contexts/AuditContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const statusColors: Record<string, string> = {
  success: "bg-status-online/10 text-status-online",
  failed: "bg-severity-critical/10 text-severity-critical",
  pending: "bg-severity-medium/10 text-severity-medium",
};

export default function AuditLogPage() {
  const { hasPermission } = useAuth();
  const { auditLog } = useAudit();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const actionTypes = useMemo(() => [...new Set(auditLog.map((e) => e.actionType))], [auditLog]);

  const filtered = useMemo(() => {
    let list = [...auditLog];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.user.toLowerCase().includes(q) || e.target.toLowerCase().includes(q) || e.comment.toLowerCase().includes(q));
    }
    if (actionFilter !== "all") list = list.filter((e) => e.actionType === actionFilter);
    return list;
  }, [auditLog, search, actionFilter]);

  const exportCsv = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Target", "Status", "Comment"];
    const rows = filtered.map((e) => [e.timestamp, e.user, e.role, e.actionType, e.target, e.status, `"${e.comment}"`]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_export_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} entries</p>
        </div>
        {hasPermission("exportAuditCsv") && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search user, target, comment…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Action Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{formatDateTime(entry.timestamp)}</TableCell>
                  <TableCell className="text-sm">{entry.user}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs capitalize">{entry.role}</Badge></TableCell>
                  <TableCell className="text-xs capitalize">{entry.actionType.replace(/_/g, " ")}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.target}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColors[entry.status] || ""}`}>
                      {entry.status}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">{entry.comment}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No audit entries found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
