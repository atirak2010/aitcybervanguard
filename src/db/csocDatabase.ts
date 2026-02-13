import Dexie, { type Table } from "dexie";
import type { Incident } from "@/types/incidents";
import type { Endpoint } from "@/types/endpoints";
import type { AuditEntry } from "@/types/audit";
import type { Alert } from "@/types/alerts";
import type { UserRole } from "@/types/auth";

export interface SyncMeta {
  key: string;
  lastSyncedAt: number;
  totalCount: number;
  syncedCount: number;
  status: "idle" | "syncing" | "error";
  errorMessage?: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

/** SHA-256 hex digest via Web Crypto API */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class CsocDatabase extends Dexie {
  incidents!: Table<Incident, string>;
  endpoints!: Table<Endpoint, string>;
  syncMeta!: Table<SyncMeta, string>;
  auditLog!: Table<AuditEntry, string>;
  alerts!: Table<Alert, string>;
  users!: Table<StoredUser, string>;

  constructor() {
    super("csoc-sentinel");
    this.version(1).stores({
      incidents: "id, severity, status, date",
      endpoints: "id, status, os, name, ip",
      syncMeta: "key",
    });
    this.version(2).stores({
      incidents: "id, severity, status, date",
      endpoints: "id, status, os, name, ip",
      syncMeta: "key",
      auditLog: "id, timestamp, user, actionType",
    });
    this.version(3).stores({
      incidents: "id, severity, status, date",
      endpoints: "id, status, os, name, ip",
      syncMeta: "key",
      auditLog: "id, timestamp, user, actionType",
      alerts: "id, severity, category, hostName, hostIp, timestamp, source",
    });
    this.version(4).stores({
      incidents: "id, severity, status, date",
      endpoints: "id, status, os, name, ip",
      syncMeta: "key",
      auditLog: "id, timestamp, user, actionType",
      alerts: "id, severity, category, hostName, hostIp, timestamp, source",
      users: "id, &email, role",
    });
  }
}

export const db = new CsocDatabase();

/** Seed default admin user if no users exist */
export async function seedDefaultAdmin(): Promise<void> {
  const count = await db.users.count();
  if (count > 0) return;
  const pw = await hashPassword("admin123");
  await db.users.add({
    id: crypto.randomUUID(),
    name: "Alex Morgan",
    email: "admin@csoc.local",
    passwordHash: pw,
    role: "admin",
    createdAt: new Date().toISOString(),
  });
}
