// lib/offline-queue.ts

export interface BaseOfflineItem {
  id: string;
  sessionId: number;
  token: string;
  timestamp: number;
  timeWindow?: number;
}

export interface MemberOfflineCheckIn extends BaseOfflineItem {
  type: "MEMBER";
  memberId: number;
  pairingToken?: string;
  phoneNumberDigits?: string;
}

export interface GuestOfflineCheckIn extends BaseOfflineItem {
  type: "GUEST";
  fullName: string;
  phoneNumber?: string;
  notes?: string;
}

export type OfflineCheckInItem = MemberOfflineCheckIn | GuestOfflineCheckIn;

const STORAGE_KEY = "scantified_offline_queue";

export function getOfflineQueue(): OfflineCheckInItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue", e);
    return [];
  }
}

export function saveOfflineQueue(items: OfflineCheckInItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to write offline queue", e);
  }
}

export function enqueueOfflineCheckIn(
  item: 
    | (Omit<MemberOfflineCheckIn, "id" | "timestamp">)
    | (Omit<GuestOfflineCheckIn, "id" | "timestamp">)
): OfflineCheckInItem {
  const fullItem = {
    ...item,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
  } as OfflineCheckInItem;

  const queue = getOfflineQueue();
  queue.push(fullItem);
  saveOfflineQueue(queue);

  return fullItem;
}

export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  const remaining: OfflineCheckInItem[] = [];
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "MEMBER") {
        const res = await fetch("/api/sessions/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: item.sessionId,
            token: item.token,
            timeWindow: item.timeWindow,
            memberId: item.memberId,
            pairingToken: item.pairingToken,
            phoneNumberDigits: item.phoneNumberDigits,
          }),
        });

        if (res.ok) {
          synced++;
        } else {
          const data = await res.json().catch(() => ({}));
          // Only drop if fundamentally invalid (e.g. member deleted), NOT for offline delays
          if (res.status === 404 || res.status === 401) {
            console.warn("Dropping invalid offline scan:", item.id, data.error);
          } else {
            remaining.push(item);
            failed++;
          }
        }
      } else if (item.type === "GUEST") {
        // Can use either /api/sessions/checkin or /api/sessions/guest
        const res = await fetch("/api/sessions/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: item.sessionId,
            token: item.token,
            timeWindow: item.timeWindow,
            guestName: item.fullName,
            guestPhone: item.phoneNumber,
            guestNotes: item.notes,
          }),
        });

        if (res.ok) {
          synced++;
        } else {
          remaining.push(item);
          failed++;
        }
      }
    } catch (networkErr) {
      // Still offline, retain in queue
      remaining.push(item);
      failed++;
    }
  }

  saveOfflineQueue(remaining);
  return { synced, failed };
}

/**
 * Exponential backoff sync manager
 */
export function startOfflineSyncManager(onSync?: (synced: number) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let currentDelay = 5000; // 5s initial
  const MAX_DELAY = 60000; // 60s cap
  let timerId: NodeJS.Timeout | null = null;
  let isActive = true;

  async function attemptSync() {
    if (!isActive) return;

    try {
      const result = await flushOfflineQueue();
      if (result.synced > 0) {
        currentDelay = 5000; // Reset to 5s on success
        if (onSync) onSync(result.synced);
      } else if (result.failed > 0) {
        currentDelay = Math.min(currentDelay * 2, MAX_DELAY); // Exponential backoff on failure
      }
    } catch {
      currentDelay = Math.min(currentDelay * 2, MAX_DELAY);
    }

    if (isActive) {
      timerId = setTimeout(attemptSync, currentDelay);
    }
  }

  // Trigger immediately on network reconnect
  function handleOnline() {
    currentDelay = 5000;
    if (timerId) clearTimeout(timerId);
    attemptSync();
  }

  window.addEventListener("online", handleOnline);
  attemptSync();

  return () => {
    isActive = false;
    if (timerId) clearTimeout(timerId);
    window.removeEventListener("online", handleOnline);
  };
}
