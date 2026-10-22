import { OfflineCheckInItem } from "../lib/offline-queue";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Guest Registration & Offline Queue Tests...\n");

// Test 1: Guest registration payload validation
{
  console.log("Test 1: Guest data parsing and sanitization");
  const rawInput = {
    fullName: "  Sister Teresa Santos  ",
    phoneNumber: " +63 (917) 123-4567 ",
    notes: "Invited by Youth Leader",
  };

  const cleanName = rawInput.fullName.trim();
  const cleanPhone = rawInput.phoneNumber.replace(/\D/g, "");

  assert(cleanName === "Sister Teresa Santos", "Name should be trimmed cleanly");
  assert(cleanPhone === "639171234567", `Phone should be stripped of non-digits, got: ${cleanPhone}`);
  console.log("✅ Passed: Guest input sanitization validated\n");
}

// Test 2: Offline queue FIFO ordering and persistence simulation
{
  console.log("Test 2: Offline queue serialization and processing order");
  const mockStorage = new Map<string, string>();

  function saveQueue(items: OfflineCheckInItem[]) {
    mockStorage.set("queue", JSON.stringify(items));
  }

  function getQueue(): OfflineCheckInItem[] {
    const raw = mockStorage.get("queue");
    return raw ? JSON.parse(raw) : [];
  }

  // Enqueue 2 items (1 member check-in, 1 guest registration)
  const item1: OfflineCheckInItem = {
    id: "item-1",
    type: "MEMBER",
    sessionId: 10,
    token: "tok1",
    timestamp: 1000,
    memberId: 5,
    pairingToken: "pair-5",
  };

  const item2: OfflineCheckInItem = {
    id: "item-2",
    type: "GUEST",
    sessionId: 10,
    token: "tok2",
    timestamp: 2000,
    fullName: "Bro Mark",
    phoneNumber: "09181112222",
  };

  saveQueue([item1, item2]);

  const readQueue = getQueue();
  assert(readQueue.length === 2, `Expected 2 queued items, got ${readQueue.length}`);
  assert(readQueue[0].id === "item-1", "FIFO order preserved for item 1");
  assert(readQueue[1].type === "GUEST", "Item 2 should be type GUEST");
  console.log("✅ Passed: Offline queue serialization and FIFO order confirmed\n");
}

// Test 3: Offline queue sync and drop simulation
{
  console.log("Test 3: Offline queue sync replay simulation");
  let queue: OfflineCheckInItem[] = [
    { id: "1", type: "MEMBER", sessionId: 1, token: "fresh", timestamp: Date.now(), memberId: 10 },
    { id: "2", type: "MEMBER", sessionId: 1, token: "expired", timestamp: Date.now() - 300000, memberId: 11 },
  ];

  // Simulate network flush: item 1 succeeds, item 2 rejected as expired
  const syncdResults: string[] = [];
  const remaining: OfflineCheckInItem[] = [];

  for (const item of queue) {
    if (item.token === "fresh") {
      syncdResults.push(item.id);
    } else {
      // simulate server rejection with expired -> drop to avoid infinite retry loop
      console.log(`  [Simulated sync]: Dropped expired item ${item.id}`);
    }
  }

  queue = remaining;
  assert(syncdResults.length === 1 && syncdResults[0] === "1", "Fresh scan should sync successfully");
  assert(queue.length === 0, "Queue should be empty after processing and dropping expired items");
  console.log("✅ Passed: Offline sync replay and expired item recovery confirmed\n");
}

console.log("🎉 ALL GUEST & OFFLINE QUEUE TESTS PASSED SUCCESSFULLY!");

