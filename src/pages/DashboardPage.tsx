import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useIncidents } from "@/hooks/useIncidents";
import { useEndpoints } from "@/hooks/useEndpoints";
import { useAlerts } from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "@/components/StatusBadges";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { AlertTriangle, ShieldAlert, ShieldCheck, Activity, Loader2, Monitor, Wifi, WifiOff, Bell } from "lucide-react";
import AttackVectorsChart from "@/components/dashboard/AttackVectorsChart";
import ActiveIncidentsTable from "@/components/dashboard/ActiveIncidentsTable";
import { getFlagUrl, getCountryName } from "@/lib/utils";

const SEVERITY_COLORS = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(210, 70%, 50%)",
  info: "hsl(220, 10%, 60%)",
};

type TimeFilter = "24h" | "7d" | "30d";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: endpoints = [], isLoading: endpointsLoading } = useEndpoints();
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const loading = incidentsLoading || endpointsLoading || alertsLoading;

  const filteredIncidents = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    if (timeFilter === "24h") cutoff.setHours(now.getHours() - 24);
    else if (timeFilter === "7d") cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);
    return incidents.filter((i) => new Date(`${i.date}T${i.time}`) >= cutoff);
  }, [timeFilter, incidents]);

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
    const days: Record<string, Record<string, number>> = {};
    filteredIncidents.forEach((i) => {
      if (!days[i.date]) days[i.date] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      days[i.date][i.severity] = (days[i.date][i.severity] || 0) + 1;
    });
    return Object.entries(days).sort().map(([date, counts]) => ({ date: date.slice(5), ...counts }));
  }, [filteredIncidents]);

  const topAttackers = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => { counts[i.source] = (counts[i.source] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => {
        const endpoint = endpoints.find((ep) => ep.name === source || ep.ip === source);
        return { source, name: endpoint?.name || source, ip: endpoint?.ip || "—", count };
      });
  }, [filteredIncidents, endpoints]);

  const topVictims = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => { counts[i.destination] = (counts[i.destination] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([target, count]) => {
        const endpoint = endpoints.find((ep) => ep.name === target || ep.ip === target);
        return { target, name: endpoint?.name || target, ip: endpoint?.ip || "—", count };
      });
  }, [filteredIncidents, endpoints]);

  // Endpoint status counts
  const endpointStats = useMemo(() => ({
    connected: endpoints.filter((e) => e.status === "connected").length,
    disconnected: endpoints.filter((e) => e.status === "disconnected").length,
    lost: endpoints.filter((e) => e.status === "lost").length,
    total: endpoints.length,
  }), [endpoints]);

  // Recent 5 alerts
  const recentAlerts = useMemo(() => alerts.slice(0, 5), [alerts]);

  // Alert trend (7 days) — use Bangkok timezone for consistency with incident dates
  const alertTrend = useMemo(() => {
    const now = new Date();
    const days: Record<string, Record<string, number>> = {};
    // Prepare last 7 day buckets in Bangkok timezone
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      days[key] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    }
    alerts.forEach((a) => {
      const dateKey = new Date(a.timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      if (days[dateKey]) {
        days[dateKey][a.severity] = (days[dateKey][a.severity] || 0) + 1;
      }
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date: date.slice(5), ...counts }));
  }, [alerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading data from Cortex XDR...</span>
      </div>
    );
  }

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

      {/* Endpoint Status Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/endpoints?status=connected")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-online/10">
              <Wifi className="h-5 w-5 text-status-online" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connected</p>
              <p className="text-xl font-bold text-status-online">{endpointStats.connected}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/endpoints?status=disconnected")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-offline/10">
              <WifiOff className="h-5 w-5 text-status-offline" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Disconnected</p>
              <p className="text-xl font-bold">{endpointStats.disconnected}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/endpoints?status=lost")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-severity-medium/10">
              <AlertTriangle className="h-5 w-5 text-severity-medium" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Connection Lost</p>
              <p className="text-xl font-bold text-severity-medium">{endpointStats.lost}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate("/endpoints")}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Endpoints</p>
              <p className="text-xl font-bold">{endpointStats.total}</p>
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
          <CardHeader><CardTitle className="text-base">Incident Trend by Severity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" stackId="severity" fill={SEVERITY_COLORS.critical} name="Critical" />
                <Bar dataKey="high" stackId="severity" fill={SEVERITY_COLORS.high} name="High" />
                <Bar dataKey="medium" stackId="severity" fill={SEVERITY_COLORS.medium} name="Medium" />
                <Bar dataKey="low" stackId="severity" fill={SEVERITY_COLORS.low} name="Low" />
                <Bar dataKey="info" stackId="severity" fill={SEVERITY_COLORS.info} name="Info" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents Table */}
      <ActiveIncidentsTable incidents={filteredIncidents} />

      {/* Alert Trend + Recent Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Alert Trend (7 Days)</CardTitle></CardHeader>
          <CardContent>
            {alertTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={alertTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="critical" stroke={SEVERITY_COLORS.critical} strokeWidth={2} dot={false} name="Critical" />
                  <Line type="monotone" dataKey="high" stroke={SEVERITY_COLORS.high} strokeWidth={2} dot={false} name="High" />
                  <Line type="monotone" dataKey="medium" stroke={SEVERITY_COLORS.medium} strokeWidth={2} dot={false} name="Medium" />
                  <Line type="monotone" dataKey="low" stroke={SEVERITY_COLORS.low} strokeWidth={1.5} dot={false} name="Low" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No alert data</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" /> Recent Alerts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAlerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[180px] truncate text-xs font-medium">{a.name}</TableCell>
                    <TableCell><SeverityBadge severity={a.severity} /></TableCell>
                    <TableCell className="font-mono text-xs">{a.hostName}</TableCell>
                    <TableCell className="text-xs">{a.actionPretty}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </TableCell>
                  </TableRow>
                ))}
                {recentAlerts.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No alerts</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
                  const flagUrl = getFlagUrl(a.source) || getFlagUrl(a.ip);
                  const country = getCountryName(a.source) || getCountryName(a.ip);
                  return (
                    <TableRow key={a.source}>
                      <TableCell className="font-mono text-sm">
                        {a.name ? `${a.name} (${a.ip})` : a.ip}
                        {flagUrl && <img src={flagUrl} alt={country} title={country} className="ml-1.5 inline-block h-[15px] w-[20px] rounded-sm border border-border/50" />}
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
                  const flagUrl = getFlagUrl(v.target) || getFlagUrl(v.ip);
                  const country = getCountryName(v.target) || getCountryName(v.ip);
                  return (
                    <TableRow key={v.target}>
                      <TableCell className="font-mono text-sm">
                        {v.name ? `${v.name} (${v.ip})` : v.ip}
                        {flagUrl && <img src={flagUrl} alt={country} title={country} className="ml-1.5 inline-block h-[15px] w-[20px] rounded-sm border border-border/50" />}
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
