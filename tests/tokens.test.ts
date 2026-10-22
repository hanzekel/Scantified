import { generateSessionToken, verifySessionToken, TOKEN_WINDOW_SECONDS } from "../lib/tokens";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("🏃 Running Rotating QR Token Tests...\n");

// Test 1: Generate valid session token
{
  console.log("Test 1: Token generation & initial verification");
  const sessionId = 42;
  const secret = "test-secret-salt-123";
  const result = generateSessionToken(sessionId, "https://scantified.app", secret);

  assert(Boolean(result.token), "Token string should be present");
  assert(result.token.length === 16, `Expected 16 char hex token, got ${result.token.length}`);
  assert(result.checkInUrl.includes(`sessionId=${sessionId}`), "Check-in URL must contain sessionId");
  assert(result.checkInUrl.includes(`token=${result.token}`), "Check-in URL must contain generated token");

  const verification = verifySessionToken(sessionId, result.token, secret);
  assert(verification.valid === true, `Expected valid token, got: ${verification.reason}`);
  console.log("✅ Passed: Token generated and verified successfully in current window\n");
}

// Test 2: Tampered token rejection
{
  console.log("Test 2: Tampered token rejection");
  const sessionId = 101;
  const secret = "test-secret-abc";
  const result = generateSessionToken(sessionId, "https://scantified.app", secret);

  const badToken = result.token.slice(0, 15) + (result.token[15] === "0" ? "1" : "0");
  const verification = verifySessionToken(sessionId, badToken, secret);
  assert(verification.valid === false, "Tampered token should be rejected");
  console.log("✅ Passed: Tampered token safely rejected\n");
}

// Test 3: Session ID mismatch rejection
{
  console.log("Test 3: Cross-session token rejection");
  const sessionA = 1;
  const sessionB = 2;
  const secret = "shared-secret";
  const tokenA = generateSessionToken(sessionA, "https://scantified.app", secret).token;

  const verification = verifySessionToken(sessionB, tokenA, secret);
  assert(verification.valid === false, "Token for session A must be rejected for session B");
  console.log("✅ Passed: Cross-session spoofing rejected\n");
}

// Test 4: Window expiration logic
{
  console.log("Test 4: Expiration outside grace window");
  const sessionId = 99;
  const secret = "expiration-test-secret";

  // Simulate token from 5 windows ago (100 seconds ago)
  const oldWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000)) - 5;
  const crypto = require("crypto");
  const oldPayload = `${sessionId}:${oldWindow}`;
  const oldToken = crypto.createHmac("sha256", secret).update(oldPayload).digest("hex").slice(0, 16);

  const verification = verifySessionToken(sessionId, oldToken, secret);
  assert(verification.valid === false, "Expired token beyond grace window must be rejected");
  assert(verification.reason?.includes("Expired or invalid"), `Unexpected reason: ${verification.reason}`);
  console.log("✅ Passed: Expired token rejected beyond grace window\n");
}

// Test 5: Offline token verification with authentic timeWindow
{
  console.log("Test 5: Authentic offline token verification with timeWindow (Spec L23)");
  const sessionId = 88;
  const secret = "offline-test-salt-456";

  // Simulate token generated 30 minutes ago (90 windows ago)
  const pastWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000)) - 90;
  const crypto = require("crypto");
  const pastToken = crypto.createHmac("sha256", secret).update(`${sessionId}:${pastWindow}`).digest("hex").slice(0, 16);

  // Without timeWindow (real-time check), it rejects
  const realtimeCheck = verifySessionToken(sessionId, pastToken, secret);
  assert(realtimeCheck.valid === false, "Should fail real-time check");

  // With timeWindow, it verifies the authentic HMAC
  const offlineCheck = verifySessionToken(sessionId, pastToken, secret, {
    timeWindow: pastWindow,
    maxOfflineHours: 24,
  });
  assert(offlineCheck.valid === true, `Offline check should be valid, got: ${offlineCheck.reason}`);

  // Tampered offline timeWindow should reject
  const badOfflineCheck = verifySessionToken(sessionId, pastToken, secret, {
    timeWindow: pastWindow + 1,
    maxOfflineHours: 24,
  });
  assert(badOfflineCheck.valid === false, "Mismatched timeWindow must reject");
  console.log("✅ Passed: Authentic offline token verified with valid timeWindow\n");
}

console.log("🎉 ALL TOKEN TESTS PASSED SUCCESSFULLY!");

