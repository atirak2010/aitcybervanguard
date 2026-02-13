import { useState, useMemo } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { useEndpoints } from "@/hooks/useEndpoints";
import { useAlerts } from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/StatusBadges";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Loader2, Clock, Bell, ShieldCheck, Monitor } from "lucide-react";
import { getFlagUrl, getCountryName } from "@/lib/utils";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "hsl(0, 72%, 51%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(45, 93%, 47%)",
  low: "hsl(210, 70%, 50%)",
  info: "hsl(220, 10%, 60%)",
};

const ACTION_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(45, 93%, 47%)",
  "hsl(210, 70%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(280, 60%, 50%)",
  "hsl(170, 45%, 45%)",
];

type TimeRange = "7d" | "30d" | "90d";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const { data: incidents = [], isLoading: incLoading } = useIncidents();
  const { data: endpoints = [], isLoading: epLoading } = useEndpoints();
  const { data: alerts = [], isLoading: alertLoading } = useAlerts();
  const loading = incLoading || epLoading || alertLoading;

  const cutoffDate = useMemo(() => {
    const now = new Date();
    if (timeRange === "7d") now.setDate(now.getDate() - 7);
    else if (timeRange === "30d") now.setDate(now.getDate() - 30);
    else now.setDate(now.getDate() - 90);
    return now;
  }, [timeRange]);

  const filteredIncidents = useMemo(
    () => incidents.filter((i) => new Date(`${i.date}T${i.time}`) >= cutoffDate),
    [incidents, cutoffDate],
  );

  const filteredAlerts = useMemo(
    () => alerts.filter((a) => new Date(a.timestamp) >= cutoffDate),
    [alerts, cutoffDate],
  );

  // --- KPIs ---
  const mttr = useMemo(() => {
    const closed = filteredIncidents.filter((i) => i.status === "closed");
    if (closed.length === 0) return null;
    // Approximate MTTR: we only have date+time of creation, not resolution time.
    // Show count of closed incidents as proxy. Real MTTR needs resolution timestamps.
    return closed.length;
  }, [filteredIncidents]);

  const endpointCoverage = useMemo(() => {
    if (endpoints.length === 0) return 0;
    const connected = endpoints.filter((e) => e.status === "connected").length;
    return Math.round((connected / endpoints.length) * 100);
  }, [endpoints]);

  const severityBreakdown = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    filteredIncidents.forEach((i) => { counts[i.severity] = (counts[i.severity] || 0) + 1; });
    return counts;
  }, [filteredIncidents]);

  // --- Incident Trend (Line chart) ---
  const incidentTrend = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    filteredIncidents.forEach((i) => {
      if (!days[i.date]) days[i.date] = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      days[i.date][i.severity] = (days[i.date][i.severity] || 0) + 1;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date: date.slice(5), ...counts }));
  }, [filteredIncidents]);

  // --- Top 10 Alert Categories (Horizontal bar) ---
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAlerts.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filteredAlerts]);

  // --- Top 10 Attacked Hosts ---
  const topHosts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAlerts.forEach((a) => {
      if (a.hostName && a.hostName !== "—") {
        counts[a.hostName] = (counts[a.hostName] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, fullName: name, count }));
  }, [filteredAlerts]);

  // --- Alert Action Distribution (Pie) ---
  const actionDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAlerts.forEach((a) => {
      const action = a.actionPretty || a.action || "Unknown";
      counts[action] = (counts[action] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredAlerts]);

  // --- Top Sources ---
  const topSources = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => { counts[i.source] = (counts[i.source] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));
  }, [filteredIncidents]);

  // --- Top Destinations ---
  const topDestinations = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach((i) => { counts[i.destination] = (counts[i.destination] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([dest, count]) => ({ dest, count }));
  }, [filteredIncidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Security operations metrics and trends</p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Resolved Incidents</p>
              <p className="text-2xl font-bold">{mttr ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">in selected period</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-severity-high/10">
              <Bell className="h-5 w-5 text-severity-high" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold">{filteredAlerts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-severity-critical/10">
              <ShieldCheck className="h-5 w-5 text-severity-critical" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Incidents by Severity</p>
              <div className="flex items-center gap-1.5 text-xs mt-0.5">
                <span className="font-bold text-severity-critical">{severityBreakdown.critical}C</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-bold text-severity-high">{severityBreakdown.high}H</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-bold text-severity-medium">{severityBreakdown.medium}M</span>
                <span className="text-muted-foreground">/</span>
                <span className="font-bold text-severity-low">{severityBreakdown.low}L</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-online/10">
              <Monitor className="h-5 w-5 text-status-online" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Endpoint Coverage</p>
              <p className="text-2xl font-bold text-status-online">{endpointCoverage}%</p>
              <p className="text-[10px] text-muted-foreground">{endpoints.filter((e) => e.status === "connected").length}/{endpoints.length} connected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Incident Trend Line Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Incident Trend by Severity</CardTitle></CardHeader>
          <CardContent>
            {incidentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={incidentTrend}>
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
              <p className="py-8 text-center text-sm text-muted-foreground">No incident data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Alert Action Distribution Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">Alert Action Distribution</CardTitle></CardHeader>
          <CardContent>
            {actionDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={actionDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                    {actionDistribution.map((_, idx) => (
                      <Cell key={idx} fill={ACTION_COLORS[idx % ACTION_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No alert data for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Alert Categories */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Alert Categories</CardTitle></CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topCategories} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={130} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(210, 70%, 50%)" radius={[0, 4, 4, 0]} name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No alert data for this period</p>
            )}
          </CardContent>
        </Card>

        {/* Top Attacked Hosts */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Attacked Hosts</CardTitle></CardHeader>
          <CardContent>
            {topHosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topHosts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={150} fontSize={11} tick={{ fill: "hsl(var(--foreground))" }} />
                  <Tooltip formatter={(value: number, _: string, props: any) => [value, props.payload.fullName]} />
                  <Bar dataKey="count" fill="hsl(0, 72%, 51%)" radius={[0, 4, 4, 0]} name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No alert data for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Sources (Incidents)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSources.map((s, idx) => {
                  const flagUrl = getFlagUrl(s.source);
                  const country = getCountryName(s.source);
                  return (
                    <TableRow key={s.source}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {s.source}
                        {flagUrl && <img src={flagUrl} alt={country} title={country} className="ml-1.5 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}
                      </TableCell>
                      <TableCell className="text-right font-medium">{s.count}</TableCell>
                    </TableRow>
                  );
                })}
                {topSources.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Destinations (Incidents)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDestinations.map((d, idx) => {
                  const flagUrl = getFlagUrl(d.dest);
                  const country = getCountryName(d.dest);
                  return (
                    <TableRow key={d.dest}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {d.dest}
                        {flagUrl && <img src={flagUrl} alt={country} title={country} className="ml-1.5 inline-block h-[13px] w-[18px] rounded-sm border border-border/50" />}
                      </TableCell>
                      <TableCell className="text-right font-medium">{d.count}</TableCell>
                    </TableRow>
                  );
                })}
                {topDestinations.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
