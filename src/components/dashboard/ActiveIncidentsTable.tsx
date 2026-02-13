import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadges";
import { Incident } from "@/types/incidents";
import { useNavigate } from "react-router-dom";

interface Props {
  incidents: Incident[];
}

export default function ActiveIncidentsTable({ incidents }: Props) {
  const navigate = useNavigate();
  const active = incidents
    .filter((i) => i.status === "open" || i.status === "investigating")
    .slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Alerts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {active.map((i) => (
              <TableRow
                key={i.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/incidents/${i.id}`)}
              >
                <TableCell className="font-mono text-sm font-medium">{i.id}</TableCell>
                <TableCell className="max-w-[260px] truncate text-sm">{i.description}</TableCell>
                <TableCell><SeverityBadge severity={i.severity} /></TableCell>
                <TableCell><StatusBadge status={i.status} /></TableCell>
                <TableCell className="text-xs">{i.relatedUsers?.join(", ") || "—"}</TableCell>
                <TableCell className="text-right">{i.alertCount}</TableCell>
              </TableRow>
            ))}
            {active.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No active incidents
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
