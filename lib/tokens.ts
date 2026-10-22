import crypto from "crypto";

const DEFAULT_SECRET = process.env.SESSION_SECRET || "scantified-dynamic-qr-secret-key-2026";
export const TOKEN_WINDOW_SECONDS = 20; // Token rotates every 20 seconds
const GRACE_WINDOWS = 1; // Allow previous window to accommodate scanning & network latency (up to 40s total)

export interface SessionTokenResult {
  token: string;
  expiresInSeconds: number;
  timeWindow: number;
  checkInUrl: string;
}

/**
 * Computes an HMAC token for a given session and time window
 */
function computeHmac(sessionId: number, windowNumber: number, secret: string): string {
  const payload = `${sessionId}:${windowNumber}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
}

/**
 * Generates a rolling token for a session
 */
export function generateSessionToken(
  sessionId: number,
  baseUrl = "",
  customSecret?: string | null
): SessionTokenResult {
  const secret = customSecret || DEFAULT_SECRET;
  const now = Date.now();
  const windowNumber = Math.floor(now / (TOKEN_WINDOW_SECONDS * 1000));
  const windowStart = windowNumber * TOKEN_WINDOW_SECONDS * 1000;
  const windowEnd = windowStart + TOKEN_WINDOW_SECONDS * 1000;
  const expiresInSeconds = Math.max(1, Math.ceil((windowEnd - now) / 1000));

  const token = computeHmac(sessionId, windowNumber, secret);

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const checkInUrl = `${cleanBase}/checkin?sessionId=${sessionId}&token=${token}&ts=${windowNumber}`;

  return {
    token,
    expiresInSeconds,
    timeWindow: windowNumber,
    checkInUrl,
  };
}

/**
 * Verifies if a presented token is valid for the session (current or immediately preceding window)
 */
export function verifySessionToken(
  sessionId: number,
  token: string,
  customSecret?: string | null
): { valid: boolean; reason?: string } {
  if (!token || typeof token !== "string" || token.length !== 16) {
    return { valid: false, reason: "Expired or invalid QR token. Please scan the live screen again." };
  }

  const secret = customSecret || DEFAULT_SECRET;
  const now = Date.now();
  const currentWindow = Math.floor(now / (TOKEN_WINDOW_SECONDS * 1000));
  const tokenBuf = Buffer.from(token);

  // Check current window and grace window(s)
  for (let w = currentWindow; w >= currentWindow - GRACE_WINDOWS; w--) {
    const expected = computeHmac(sessionId, w, secret);
    const expectedBuf = Buffer.from(expected);
    if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
      return { valid: true };
    }
  }

  return { valid: false, reason: "Expired or invalid QR token. Please scan the live screen again." };
}
