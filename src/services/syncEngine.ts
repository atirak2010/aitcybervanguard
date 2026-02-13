import { db, type SyncMeta } from "@/db/csocDatabase";
import { API_MODE, mapXdrIncident, mapXdrEndpoint } from "@/services/api";
import { mockIncidents } from "@/data/mock-incidents";
import { mockEndpoints } from "@/data/mock-endpoints";
import {
  getIncidents as xdrGetIncidents,
  getEndpoints as xdrGetEndpoints,
} from "@/services/cortexXdrApi";

const PAGE_SIZE = 100;
const INCIDENT_MAX_PAGES = 20; // up to 2000 incidents per sync
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// --- Pub/sub for sync status ---

type SyncListener = (meta: SyncMeta) => void;
const listeners: Set<SyncListener> = new Set();

export function onSyncChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function notify(meta: SyncMeta) {
  listeners.forEach((fn) => fn(meta));
}

// --- Incident sync ---

async function syncIncidents(): Promise<void> {
  const metaKey = "incidents";

  const syncingMeta: SyncMeta = {
    key: metaKey,
    lastSyncedAt: Date.now(),
    totalCount: 0,
    syncedCount: 0,
    status: "syncing",
  };
  await db.syncMeta.put(syncingMeta);
  notify(syncingMeta);

  if (API_MODE === "mock") {
    await db.incidents.bulkPut(mockIncidents);
    const meta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: mockIncidents.length,
      syncedCount: mockIncidents.length,
      status: "idle",
    };
    await db.syncMeta.put(meta);
    notify(meta);
    return;
  }

  try {
    let totalFetched = 0;
    for (let page = 0; page < INCIDENT_MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const result = await xdrGetIncidents([], from, to);

      const mapped = result.incidents.map(mapXdrIncident);
      await db.incidents.bulkPut(mapped);
      totalFetched += mapped.length;

      const progressMeta: SyncMeta = {
        key: metaKey,
        lastSyncedAt: Date.now(),
        totalCount: result.total_count,
        syncedCount: totalFetched,
        status: "syncing",
      };
      await db.syncMeta.put(progressMeta);
      notify(progressMeta);

      if (result.incidents.length < PAGE_SIZE) break;
    }

    const finalMeta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: totalFetched,
      syncedCount: totalFetched,
      status: "idle",
    };
    await db.syncMeta.put(finalMeta);
    notify(finalMeta);
  } catch (err) {
    const cachedCount = await db.incidents.count();
    const errorMeta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: 0,
      syncedCount: cachedCount,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Sync failed",
    };
    await db.syncMeta.put(errorMeta);
    notify(errorMeta);
  }
}

// --- Endpoint sync ---

async function syncEndpoints(): Promise<void> {
  const metaKey = "endpoints";

  const syncingMeta: SyncMeta = {
    key: metaKey,
    lastSyncedAt: Date.now(),
    totalCount: 0,
    syncedCount: 0,
    status: "syncing",
  };
  await db.syncMeta.put(syncingMeta);
  notify(syncingMeta);

  if (API_MODE === "mock") {
    await db.endpoints.bulkPut(mockEndpoints);
    const meta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: mockEndpoints.length,
      syncedCount: mockEndpoints.length,
      status: "idle",
    };
    await db.syncMeta.put(meta);
    notify(meta);
    return;
  }

  try {
    const ENDPOINT_MAX_PAGES = 15; // up to 1500 endpoints
    let totalFetched = 0;

    for (let page = 0; page < ENDPOINT_MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE;
      const result = await xdrGetEndpoints([], from, to);

      const mapped = result.endpoints.map(mapXdrEndpoint);
      await db.endpoints.bulkPut(mapped);
      totalFetched += mapped.length;

      const progressMeta: SyncMeta = {
        key: metaKey,
        lastSyncedAt: Date.now(),
        totalCount: result.total_count,
        syncedCount: totalFetched,
        status: "syncing",
      };
      await db.syncMeta.put(progressMeta);
      notify(progressMeta);

      if (result.endpoints.length < PAGE_SIZE) break;
    }

    const meta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: totalFetched,
      syncedCount: totalFetched,
      status: "idle",
    };
    await db.syncMeta.put(meta);
    notify(meta);
  } catch (err) {
    const cachedCount = await db.endpoints.count();
    const errorMeta: SyncMeta = {
      key: metaKey,
      lastSyncedAt: Date.now(),
      totalCount: 0,
      syncedCount: cachedCount,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Sync failed",
    };
    await db.syncMeta.put(errorMeta);
    notify(errorMeta);
  }
}

// --- Public API ---

export async function syncAll(): Promise<void> {
  await Promise.all([syncIncidents(), syncEndpoints()]);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(): void {
  if (intervalId) return;
  syncAll();
  intervalId = setInterval(syncAll, SYNC_INTERVAL_MS);
}

export function stopPeriodicSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function getSyncMeta(key: string): Promise<SyncMeta | undefined> {
  return db.syncMeta.get(key);
}
