import Dexie, { type Table } from "dexie";
import type { Incident } from "@/types/incidents";
import type { Endpoint } from "@/types/endpoints";

export interface SyncMeta {
  key: string;
  lastSyncedAt: number;
  totalCount: number;
  syncedCount: number;
  status: "idle" | "syncing" | "error";
  errorMessage?: string;
}

export class CsocDatabase extends Dexie {
  incidents!: Table<Incident, string>;
  endpoints!: Table<Endpoint, string>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super("csoc-sentinel");
    this.version(1).stores({
      incidents: "id, severity, status, date",
      endpoints: "id, status, os, name, ip",
      syncMeta: "key",
    });
  }
}

export const db = new CsocDatabase();
