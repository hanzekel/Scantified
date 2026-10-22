import { calculateEventAnalytics, SessionSummary } from "../lib/analytics";
import * as XLSX from "xlsx";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Event Analytics & Matrix Export Tests...\n");

// Test 1: Full tier categorization and dynamic denominator
{
  console.log("Test 1: Dynamic denominator & tier categorization");
  const sessions: SessionSummary[] = [
    { id: 1, title: "Session 1", date: new Date("2026-10-01"), sessionType: "Plenary", status: "CONCLUDED" },
    { id: 2, title: "Session 2", date: new Date("2026-10-02"), sessionType: "Plenary", status: "CONCLUDED" },
    { id: 3, title: "Session 3", date: new Date("2026-10-03"), sessionType: "Plenary", status: "CONCLUDED" },
    { id: 4, title: "Session 4", date: new Date("2026-10-04"), sessionType: "Plenary", status: "CANCELLED" }, // should be ignored!
  ];

  const members = [
    { id: 101, fullName: "Alice Top", campName: "Alpha", role: "Camper" },
    { id: 102, fullName: "Bob Excused", campName: "Beta", role: "Camper" },
    { id: 103, fullName: "Charlie AtRisk", campName: "Gamma", role: "Camper" },
    { id: 104, fullName: "Dave Absent", campName: "Delta", role: "Camper" },
  ];

  const records = [
    // Alice: Present at 1, 2, 3 -> 3/3 = 100%
    { sessionId: 1, memberId: 101, status: "PRESENT" },
    { sessionId: 2, memberId: 101, status: "PRESENT" },
    { sessionId: 3, memberId: 101, status: "PRESENT" },

    // Bob: Present at 1, Excused at 2, Excused at 3 -> 1 / (3 - 2) = 1/1 = 100%
    { sessionId: 1, memberId: 102, status: "PRESENT" },
    { sessionId: 2, memberId: 102, status: "EXCUSED" },
    { sessionId: 3, memberId: 102, status: "EXCUSED" },

    // Charlie: Present at 1, Absent at 2 & 3 -> 1/3 = 33% (<50% -> AT_RISK)
    { sessionId: 1, memberId: 103, status: "PRESENT" },

    // Dave: Absent all 3 -> NO_ATTENDANCE
  ];

  const result = calculateEventAnalytics(sessions, members, records);

  assert(result.summary.elapsedSessions === 3, `Expected 3 elapsed sessions (excluding cancelled), got ${result.summary.elapsedSessions}`);
  assert(result.tiers.mostPresent.some((m) => m.fullName === "Alice Top"), "Alice should be in MOST_PRESENT");
  assert(result.tiers.mostPresent.some((m) => m.fullName === "Bob Excused"), "Bob should be in MOST_PRESENT (excused deducted)");
  assert(result.tiers.atRisk.some((m) => m.fullName === "Charlie AtRisk"), "Charlie should be in AT_RISK");
  assert(result.tiers.noAttendance.some((m) => m.fullName === "Dave Absent"), "Dave should be in NO_ATTENDANCE");

  // Verify Bob's rate: 100% because 2 excused deducted from denominator 3
  const bob = result.allMembers.find((m) => m.memberId === 102)!;
  assert(bob.applicableCount === 1, `Bob applicable should be 1, got ${bob.applicableCount}`);
  assert(bob.rate === 100, `Bob rate should be 100%, got ${bob.rate}%`);

  // Verify Alice streak: 3
  const alice = result.allMembers.find((m) => m.memberId === 101)!;
  assert(alice.currentStreak === 3, `Alice streak should be 3, got ${alice.currentStreak}`);

  console.log("✅ Passed: Tier categorization, excused deductions, and streaks validated\n");
}

// Test 2: Excel workbook generation from matrix
{
  console.log("Test 2: Excel matrix spreadsheet generation");
  const rows = [
    ["Member Name", "Cohort", "Session 1", "Session 2", "Rate %"],
    ["Alice", "Camp San Pedro", "P", "P", "100%"],
    ["Bob", "Camp San Pablo", "P", "E", "100%"],
    ["Charlie", "Camp San Juan", "A", "A", "0%"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance Matrix");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  assert(buf && buf.length > 0, "Excel buffer should be non-empty");

  // Read back buffer to verify integrity
  const readWb = XLSX.read(buf, { type: "buffer" });
  assert(readWb.SheetNames.includes("Attendance Matrix"), "Sheet name should match");
  console.log("✅ Passed: Excel spreadsheet buffer generation and parsing verified\n");
}

// Test 3: Mid-season joiner grading fairness
{
  console.log("Test 3: Mid-season joiner grading fairness (Spec L27)");
  const sessions: SessionSummary[] = [
    { id: 1, title: "Day 1 Service", date: new Date("2026-10-01"), sessionType: "Plenary", status: "CONCLUDED" },
    { id: 2, title: "Day 2 Service", date: new Date("2026-10-02"), sessionType: "Plenary", status: "CONCLUDED" },
    { id: 3, title: "Day 3 Service", date: new Date("2026-10-03"), sessionType: "Plenary", status: "CONCLUDED" },
  ];

  const members = [
    // Joined before event
    { id: 201, fullName: "Early Member", campName: "Alpha", role: "Camper", createdAt: new Date("2026-09-25") },
    // Joined on Day 2 of event (mid-season)
    { id: 202, fullName: "Mid-Season Joiner", campName: "Beta", role: "Camper", createdAt: new Date("2026-10-02") },
  ];

  const records = [
    { sessionId: 1, memberId: 201, status: "PRESENT" },
    { sessionId: 2, memberId: 201, status: "PRESENT" },
    { sessionId: 3, memberId: 201, status: "PRESENT" },

    // Mid-season joiner attends Day 2 and Day 3
    { sessionId: 2, memberId: 202, status: "PRESENT" },
    { sessionId: 3, memberId: 202, status: "PRESENT" },
  ];

  const result = calculateEventAnalytics(sessions, members, records);
  const midSeason = result.allMembers.find((m) => m.memberId === 202)!;

  // Mid-season joiner Day 1 should be N/A, applicable should be 2, rate should be 100%
  assert(midSeason.sessionStatuses[1] === "N/A", "Day 1 should be N/A for mid-season joiner");
  assert(midSeason.applicableCount === 2, `Mid-season applicable should be 2, got ${midSeason.applicableCount}`);
  assert(midSeason.rate === 100, `Mid-season rate should be 100%, got ${midSeason.rate}%`);
  console.log("✅ Passed: Mid-season joiner graded fairly on attended applicable sessions\n");
}

// Test 4: Premature elapsed check for SCHEDULED sessions today
{
  console.log("Test 4: SCHEDULED sessions today not counted as elapsed prematurely");
  const testNow = new Date("2026-10-15T10:00:00Z").getTime();

  const sessions: SessionSummary[] = [
    // Yesterday: CONCLUDED -> elapsed
    { id: 1, title: "Yesterday Plenary", date: new Date("2026-10-14T00:00:00Z"), sessionType: "Plenary", status: "CONCLUDED" },
    // Today evening: SCHEDULED -> NOT elapsed yet!
    { id: 2, title: "Tonight Plenary", date: new Date("2026-10-15T00:00:00Z"), sessionType: "Plenary", status: "SCHEDULED" },
    // Tomorrow: SCHEDULED -> NOT elapsed
    { id: 3, title: "Tomorrow Plenary", date: new Date("2026-10-16T00:00:00Z"), sessionType: "Plenary", status: "SCHEDULED" },
  ];

  const members = [{ id: 301, fullName: "Grace", campName: "Alpha", role: "Camper" }];
  const records = [{ sessionId: 1, memberId: 301, status: "PRESENT" }];

  const result = calculateEventAnalytics(sessions, members, records, testNow);
  assert(result.summary.elapsedSessions === 1, `Expected 1 elapsed session, got ${result.summary.elapsedSessions}`);
  assert(!result.sessions.some((s) => s.id === 2), "Tonight's scheduled session should not be elapsed at 10 AM");
  console.log("✅ Passed: SCHEDULED sessions today not counted as elapsed prematurely\n");
}

console.log("🎉 ALL ANALYTICS & MATRIX TESTS PASSED SUCCESSFULLY!");

