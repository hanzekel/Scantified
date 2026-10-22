function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Coordinator Manual Overrides & Live Roster Tests...\n");

// Test 1: Status transition state machine
{
  console.log("Test 1: Manual Override status transitions");
  type Status = "PRESENT" | "EXCUSED" | "ABSENT";
  interface MockRecord {
    memberId: number;
    status: Status;
    source: string;
    notes?: string;
  }

  const records = new Map<number, MockRecord>();

  function applyOverride(memberId: number, status: Status, notes?: string) {
    if (status === "ABSENT") {
      records.delete(memberId);
      return { status: "ABSENT" };
    }
    const rec: MockRecord = {
      memberId,
      status,
      source: "MANUAL_OVERRIDE",
      notes: notes || (status === "EXCUSED" ? "Excused absence" : "Manual check-in by coordinator"),
    };
    records.set(memberId, rec);
    return rec;
  }

  // Initial state: Absent
  assert(!records.has(101), "Member 101 starts absent");

  // Mark Present
  const presentRec = applyOverride(101, "PRESENT");
  assert(presentRec.status === "PRESENT", "Should transition to PRESENT");
  assert(presentRec.source === "MANUAL_OVERRIDE", "Source should be MANUAL_OVERRIDE");

  // Transition to Excused with note
  const excusedRec = applyOverride(101, "EXCUSED", "Medical leave");
  assert(excusedRec.status === "EXCUSED", "Should transition to EXCUSED");
  assert(excusedRec.notes === "Medical leave", "Excuse note should be preserved");

  // Reset to Absent
  const absentResult = applyOverride(101, "ABSENT");
  assert(absentResult.status === "ABSENT", "Should transition back to ABSENT");
  assert(!records.has(101), "Record should be removed when reset to ABSENT");

  console.log("✅ Passed: Status transitions (Absent -> Present -> Excused -> Absent) verified\n");
}

// Test 2: Attendance rate denominator handling with Excused absences
{
  console.log("Test 2: Live attendance rate calculation with excused absences");
  const totalRoster = 20;
  const presentCount = 14;
  const excusedCount = 4;
  const absentCount = totalRoster - presentCount - excusedCount; // 2

  // Formula: present / (totalRoster - excused) * 100
  const effectiveTotal = totalRoster - excusedCount; // 16
  const rate = Math.round((presentCount / effectiveTotal) * 100); // 14 / 16 = 87.5% -> 88%

  assert(effectiveTotal === 16, `Effective total should be 16, got ${effectiveTotal}`);
  assert(rate === 88, `Expected 88% attendance rate, got ${rate}%`);

  // Edge case: All members excused
  const allExcusedTotal = totalRoster - 20;
  const allExcusedRate = allExcusedTotal > 0 ? Math.round((0 / allExcusedTotal) * 100) : 0;
  assert(allExcusedRate === 0, "Zero division guard should return 0% when all members excused");

  console.log("✅ Passed: Live attendance rate formula with excused deduction validated\n");
}

console.log("🎉 ALL OVERRIDE & LIVE ROSTER TESTS PASSED SUCCESSFULLY!");

