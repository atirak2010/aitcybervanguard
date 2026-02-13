import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole, ROLE_LABELS } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, ShieldCheck, ShieldAlert } from "lucide-react";

const roles: { role: UserRole; icon: React.ElementType; desc: string }[] = [
  { role: "analyst", icon: User, desc: "View dashboard, investigate incidents, limited response actions" },
  { role: "manager", icon: ShieldCheck, desc: "Close incidents, export CSV, view audit log" },
  { role: "admin", icon: ShieldAlert, desc: "Full access including endpoint actions & audit" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole) => {
    setLoading(role);
    setTimeout(() => { login(role); setLoading(null); }, 400);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/20 ring-1 ring-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AIT Cyber Vanguard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Security Operations Center</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Role to Login</CardTitle>
            <CardDescription>Choose a role to access the platform with its permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {roles.map(({ role, icon: Icon, desc }) => (
              <Button
                key={role}
                variant="outline"
                className="flex h-auto w-full items-start justify-start gap-3 p-4 text-left group hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
                disabled={loading !== null}
                onClick={() => handleLogin(role)}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 shadow-sm group-hover:bg-primary/15 group-hover:shadow-md group-hover:shadow-primary/15 transition-all">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{ROLE_LABELS[role]}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">Mock authentication — No credentials required</p>
      </div>
    </div>
  );
}
