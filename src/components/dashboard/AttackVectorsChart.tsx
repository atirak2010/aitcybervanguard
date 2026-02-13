import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Incident } from "@/types/incidents";

const VECTOR_COLORS = [
  "hsl(220, 60%, 45%)",
  "hsl(210, 70%, 55%)",
  "hsl(200, 50%, 65%)",
  "hsl(190, 40%, 50%)",
  "hsl(170, 45%, 45%)",
  "hsl(0, 60%, 50%)",
];

function classifyVector(description: string): string {
  const d = description.toLowerCase();
  if (d.includes("ransomware") || d.includes("malware") || d.includes("cryptominer") || d.includes("beaconing"))
    return "Malware";
  if (d.includes("phishing")) return "Phishing";
  if (d.includes("brute force") || d.includes("unauthorized access") || d.includes("privilege escalation"))
    return "Credential Attack";
  if (d.includes("lateral movement") || d.includes("exfiltration") || d.includes("dns tunneling"))
    return "Network Exploit";
  if (d.includes("powershell") || d.includes("suspicious")) return "Suspicious Execution";
  return "Other";
}

interface Props {
  incidents: Incident[];
}

export default function AttackVectorsChart({ incidents }: Props) {
  const { vectorData, totalEvents } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    incidents.forEach((i) => {
      const vector = classifyVector(i.description);
      counts[vector] = (counts[vector] || 0) + i.alertCount;
      total += i.alertCount;
    });
    const data = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
    return { vectorData: data, totalEvents: total };
  }, [incidents]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Attack Vectors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut with center label */}
          <div className="relative h-[180px] w-[180px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {vectorData.map((_, idx) => (
                    <Cell key={idx} fill={VECTOR_COLORS[idx % VECTOR_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center number */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {totalEvents.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Events
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2">
            {vectorData.map((entry, idx) => {
              const pct = totalEvents > 0 ? Math.round((entry.value / totalEvents) * 100) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: VECTOR_COLORS[idx % VECTOR_COLORS.length] }}
                  />
                  <span className="text-foreground">
                    {entry.name} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
