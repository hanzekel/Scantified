export interface OfflineCheckInItem {
  id: string;
  type: "MEMBER" | "GUEST";
  sessionId: number;
  token: string;
  timestamp: number;
  // For MEMBER
  memberId?: number;
  pairingToken?: string;
  phoneNumberDigits?: string;
  // For GUEST
  fullName?: string;
  phoneNumber?: string;
  notes?: string;
}

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

export function enqueueOfflineCheckIn(item: Omit<OfflineCheckInItem, "id" | "timestamp">): OfflineCheckInItem {
  const fullItem: OfflineCheckInItem = {
    ...item,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
  };

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
            memberId: item.memberId,
            pairingToken: item.pairingToken,
            phoneNumberDigits: item.phoneNumberDigits,
          }),
        });

        if (res.ok) {
          synced++;
        } else {
          // If server rejects with 400 (e.g. expired beyond grace), drop to avoid infinite retry loop
          const data = await res.json().catch(() => ({}));
          if (res.status === 400 && data.error?.includes("expired")) {
            console.warn("Dropping expired offline scan:", item.id);
          } else {
            remaining.push(item);
            failed++;
          }
        }
      } else if (item.type === "GUEST") {
        const res = await fetch("/api/sessions/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: item.sessionId,
            token: item.token,
            fullName: item.fullName,
            phoneNumber: item.phoneNumber,
            notes: item.notes,
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
      // Still offline, retain item
      remaining.push(item);
      failed++;
    }
  }

  saveOfflineQueue(remaining);
  return { synced, failed };
}

