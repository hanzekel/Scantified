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

console.log("🎉 ALL ANALYTICS & MATRIX TESTS PASSED SUCCESSFULLY!");

