import { useState, useMemo } from "react";
import { mockIncidents } from "@/data/mock-incidents";
import { mockEndpoints } from "@/data/mock-endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/StatusBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import AttackVectorsChart from "@/components/dashboard/AttackVectorsChart";
import ActiveIncidentsTable from "@/components/dashboard/ActiveIncidentsTable";
import { getCountryFlag } from "@/lib/utils";

const SEVERITY_COLORS = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(210, 70%, 50%)",
  info: "hsl(220, 10%, 60%)",
};

type TimeFilter = "24h" | "7d" | "30d";

export default function DashboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");

  const filteredIncidents = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeFilter === "24h") cutoff.setHours(now.getHours() - 24);
    else if (timeFilter === "7d") cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);
    return mockIncidents.filter((i) => new Date(`${i.date}T${i.time}`) >= cutoff);
  }, [timeFilter]);

  const totalIncidents = filteredIncidents.length;
  const criticalIncidents = filteredIncidents.filter((i) => i.severity === "critical").length;
  const preventedIncidents = filteredIncidents.filter((i) => i.status === "contained" || i.status === "closed").length;
  const openIncidents = filteredIncidents.filter((i) => i.status === "open").length;

  const severityData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  const trendData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredIncidents.forEach((i) => { days[i.date] = (days[i.date] || 0) + 1; });
    return Object.entries(days).sort().map(([date, count]) => ({ date: date.slice(5), count }));
  }, [filteredIncidents]);

const topAttackers = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredIncidents.forEach((i) => { counts[i.source] = (counts[i.source] || 0) + 1; });
     return Object.entries(counts)
       .sort((a, b) => b[1] - a[1])
       .slice(0, 10)
       .map(([source, count]) => {
         const endpoint = mockEndpoints.find((ep) => ep.name === source || ep.ip === source);
         return {
           source,
           name: endpoint?.name || source,
           ip: endpoint?.ip || "—",
           count,
         };
       });
   }, [filteredIncidents]);

const topVictims = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredIncidents.forEach((i) => { counts[i.destination] = (counts[i.destination] || 0) + 1; });
     return Object.entries(counts)
       .sort((a, b) => b[1] - a[1])
       .slice(0, 10)
       .map(([target, count]) => {
         const endpoint = mockEndpoints.find((ep) => ep.name === target || ep.ip === target);
         return {
           target,
           name: endpoint?.name || target,
           ip: endpoint?.ip || "—",
           count,
         };
       });
   }, [filteredIncidents]);

  return (
    <div className="space-y-6">
      {/* Header with time filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Security Operations Overview</p>
        </div>
        <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Incidents</p>
              <p className="text-2xl font-bold">{totalIncidents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-severity-critical/10">
              <ShieldAlert className="h-5 w-5 text-severity-critical" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-severity-critical">{criticalIncidents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-online/10">
              <ShieldCheck className="h-5 w-5 text-status-online" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prevented</p>
              <p className="text-2xl font-bold text-status-online">{preventedIncidents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-severity-high/10">
              <AlertTriangle className="h-5 w-5 text-severity-high" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-severity-high">{openIncidents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Incidents by Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name as keyof typeof SEVERITY_COLORS] || "#888"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Incident Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(220, 70%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents Table */}
      <ActiveIncidentsTable incidents={filteredIncidents} />

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Attackers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Incidents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topAttackers.map((a) => {
                   const flag = getCountryFlag(a.source) || getCountryFlag(a.ip);
                   return (
                     <TableRow key={a.source}>
                       <TableCell className="font-mono text-sm">
                         {a.name ? `${a.name} (${a.ip})` : a.ip}
                         {flag && <span className="ml-1.5">{flag}</span>}
                       </TableCell>
                       <TableCell className="text-right">{a.count}</TableCell>
                     </TableRow>
                   );
                 })}
                {topAttackers.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top Victims</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Incidents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVictims.map((v) => {
                   const flag = getCountryFlag(v.target) || getCountryFlag(v.ip);
                   return (
                     <TableRow key={v.target}>
                       <TableCell className="font-mono text-sm">
                         {v.name ? `${v.name} (${v.ip})` : v.ip}
                         {flag && <span className="ml-1.5">{flag}</span>}
                       </TableCell>
                       <TableCell className="text-right">{v.count}</TableCell>
                     </TableRow>
                   );
                 })}
                {topVictims.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
