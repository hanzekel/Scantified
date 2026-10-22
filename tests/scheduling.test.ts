import { generateSessionsFromSchedule } from "../lib/scheduling";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Scheduling Engine Tests...\n");

// Test 1: Multi-day consecutive event (e.g. 3-day youth camp)
{
  console.log("Test 1: Multi-day consecutive event generation");
  const sessions = generateSessionsFromSchedule(
    "Youth Camp 2026",
    {
      ruleType: "DATE_RANGE",
      startDate: "2026-11-13",
      endDate: "2026-11-15",
    },
    "Plenary"
  );

  assert(sessions.length === 3, `Expected 3 sessions, got ${sessions.length}`);
  assert(sessions[0].title === "Youth Camp 2026 - Day 1", `Unexpected title: ${sessions[0].title}`);
  assert(sessions[1].title === "Youth Camp 2026 - Day 2", `Unexpected title: ${sessions[1].title}`);
  assert(sessions[2].title === "Youth Camp 2026 - Day 3", `Unexpected title: ${sessions[2].title}`);
  assert(sessions[0].eventDay === 1, `Expected eventDay 1, got ${sessions[0].eventDay}`);
  assert(sessions[0].status === "SCHEDULED", `Expected status SCHEDULED`);
  console.log("✅ Passed: Multi-day event generated 3 consecutive days properly\n");
}

// Test 2: Weekly recurring event on Fridays and Sundays across 2 weeks
{
  console.log("Test 2: Weekly recurring days (Friday & Sunday)");
  // 2026-11-01 is a Sunday
  // 2026-11-15 is a Sunday
  const sessions = generateSessionsFromSchedule(
    "Weekend Church Gathering",
    {
      ruleType: "WEEKLY_DAYS",
      startDate: "2026-11-01",
      endDate: "2026-11-15",
      daysOfWeek: ["FRIDAY", "SUNDAY"],
    },
    "Worship"
  );

  // In this range:
  // Nov 1 (Sun), Nov 6 (Fri), Nov 8 (Sun), Nov 13 (Fri), Nov 15 (Sun) -> 5 sessions
  assert(sessions.length === 5, `Expected 5 sessions, got ${sessions.length}`);
  for (const s of sessions) {
    const day = s.date.getDay();
    assert(day === 0 || day === 5, `Expected Sunday (0) or Friday (5), got day index ${day}`);
    assert(s.sessionType === "Worship", `Expected sessionType Worship, got ${s.sessionType}`);
    assert(s.status === "SCHEDULED", `Expected status SCHEDULED`);
  }
  console.log("✅ Passed: Generated 5 matching Friday/Sunday sessions across range\n");
}

// Test 3: Rejection of invalid date range (start > end)
{
  console.log("Test 3: Date boundary error handling");
  let threw = false;
  try {
    generateSessionsFromSchedule("Bad Range", {
      ruleType: "DATE_RANGE",
      startDate: "2026-11-20",
      endDate: "2026-11-10",
    });
  } catch (err: any) {
    threw = true;
    assert(err.message.includes("Start date cannot be after end date"), `Wrong error: ${err.message}`);
  }
  assert(threw, "Expected error when startDate > endDate");
  console.log("✅ Passed: Caught invalid date order\n");
}

// Test 4: Rejection of recurring schedule with no days specified
{
  console.log("Test 4: Empty days validation");
  let threw = false;
  try {
    generateSessionsFromSchedule("No Days", {
      ruleType: "WEEKLY_DAYS",
      startDate: "2026-11-01",
      endDate: "2026-11-10",
      daysOfWeek: [],
    });
  } catch (err: any) {
    threw = true;
    assert(err.message.includes("At least one day of week"), `Wrong error: ${err.message}`);
  }
  assert(threw, "Expected error when no days selected");
  console.log("✅ Passed: Caught empty days of week\n");
}

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");

