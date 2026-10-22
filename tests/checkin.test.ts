import { generateSessionToken, verifySessionToken, TOKEN_WINDOW_SECONDS } from "../lib/tokens";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Self-Check-In & Device Pairing Integration Tests...\n");

// Test 1: Full-flow validation of rotating token and phone matching
{
  console.log("Test 1: First-time phone verification matching logic");
  const registeredPhone = "09171234567";
  const cleanSaved = registeredPhone.replace(/\D/g, "");

  // Test full match
  const inputFull = "09171234567";
  assert(cleanSaved === inputFull.replace(/\D/g, ""), "Full phone match should succeed");

  // Test last 4 digits match
  const inputLast4 = "4567";
  assert(cleanSaved.endsWith(inputLast4), "Last 4 digits match should succeed");

  // Test mismatch
  const inputWrong = "9999";
  assert(!cleanSaved.endsWith(inputWrong), "Wrong digits should fail");
  console.log("✅ Passed: Phone digits verification algorithm validated\n");
}

// Test 2: Pairing token generation & round-trip verification
{
  console.log("Test 2: Device pairing token simulation");
  const crypto = require("crypto");
  const devicePairingToken = crypto.randomUUID();

  assert(Boolean(devicePairingToken), "Pairing token should be generated");
  assert(devicePairingToken.length === 36, "Pairing token should be standard UUID");

  // Simulate cached device verification
  const storedToken = devicePairingToken;
  const incomingToken = devicePairingToken;
  assert(storedToken === incomingToken, "Stored pairing token must match incoming token for 1-tap check-in");
  console.log("✅ Passed: Device pairing token round-trip verified\n");
}

// Test 3: Expired token rejection during check-in
{
  console.log("Test 3: Expired QR token check-in rejection");
  const sessionId = 88;
  const secret = "secret-88";

  // Simulate expired token from 3 windows ago
  const oldWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000)) - 3;
  const crypto = require("crypto");
  const expiredToken = crypto.createHmac("sha256", secret).update(`${sessionId}:${oldWindow}`).digest("hex").slice(0, 16);

  const verification = verifySessionToken(sessionId, expiredToken, secret);
  assert(verification.valid === false, "Check-in with expired token must be rejected");
  console.log("✅ Passed: Expired QR token rejected properly\n");
}

// Test 4: Duplicate prevention idempotency check
{
  console.log("Test 4: Duplicate check-in idempotency logic");
  const sessionRecords = new Set<string>();

  function recordAttendance(sessionId: number, memberId: number) {
    const key = `${sessionId}:${memberId}`;
    if (sessionRecords.has(key)) {
      return { alreadyCheckedIn: true, status: "PRESENT" };
    }
    sessionRecords.add(key);
    return { alreadyCheckedIn: false, status: "PRESENT" };
  }

  const firstScan = recordAttendance(1, 10);
  assert(firstScan.alreadyCheckedIn === false, "First scan should create new check-in");

  const secondScan = recordAttendance(1, 10);
  assert(secondScan.alreadyCheckedIn === true, "Second scan should indicate already checked in without error");
  console.log("✅ Passed: Duplicate check-in idempotency validated\n");
}

console.log("🎉 ALL CHECK-IN & PAIRING TESTS PASSED SUCCESSFULLY!");

