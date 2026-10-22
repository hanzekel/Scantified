# 0003: Lightweight Device Pairing via Phone Verification

## Context
Self-check-in requires identifying which member is scanning the Session QR. Requiring full password-based accounts creates severe onboarding friction and forgotten-password delays during event entry. Conversely, an unauthenticated name dropdown invites attendees to playfully or accidentally check in peers.

## Decision
We decided on lightweight device pairing: when an attendee scans the Session QR for the first time, they search for their name and confirm identity by entering their registered phone number or last 4 digits. Upon successful match, an opaque pairing token is stored in the browser's `localStorage`. All subsequent scans from that device automatically recognize the member, requiring only a single tap to check in.

## Consequences & Trade-offs
- Eliminates account creation friction and third-party SMS OTP carrier costs.
- Fast 1-tap check-ins for repeat attendees across the event's duration.
- If an attendee switches devices or clears browser data, they must re-verify using their phone number.

