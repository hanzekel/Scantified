# Feature Spec: Dynamic Session QR Self-Check-In, Flexible Scheduling & Attendance Analytics

## Problem Statement

Current attendance tracking requires coordinators to print individual QR badges for every member and physically scan each person as they enter the venue. For multi-day camps, church congregations, and recurring classes, this causes registration queues, wasted badge printing costs, bottlenecks at the entrance doors, and frustration when badges are lost or forgotten. Furthermore, coordinators lack flexible tools to configure schedules (multi-day retreats vs recurring days of the week like Fridays and Sundays) and cannot easily see who attends regularly, who is falling behind, and who is completely absent.

## Solution

Invert the attendance scanning flow: each event session displays a single, time-rotating dynamic Session QR code on the venue's projector or screen. Attendees simply scan this QR code using their personal smartphone cameras, select their name from the pre-enrolled roster, and complete a one-time lightweight phone verification to pair their device. All future scans from their device take a single tap. Visitors and walk-ins can register inline as guests. Coordinators can configure multi-day or recurring weekly schedules that pre-materialize upcoming sessions, manually record excused absences or smartphone-less check-ins, and inspect real-time analytics ranking members by attendance rate alongside a full exportable attendance matrix.

## User Stories

1. As a coordinator, I want to create a multi-day event with specific start and end dates, so that sessions across the camp are pre-materialized in my calendar.
2. As a coordinator, I want to create a recurring event on specific days of the week (e.g., Fridays and Sundays or Monday through Friday), so that weekly sessions are scheduled automatically across a chosen date horizon.
3. As a coordinator, I want to view a visual calendar of all upcoming event sessions, so that I can rename, adjust times, or cancel specific holiday sessions in advance.
4. As a coordinator, I want to launch an active session display screen on a projector or laptop, so that attendees can see a large, dynamic Session QR code during check-in.
5. As a coordinator, I want the Session QR code token to rotate automatically every 15–30 seconds, so that attendees cannot photograph the code and forward it to absent friends.
6. As a coordinator, I want to see a live check-in ticker on the session display, so that I can observe headcount and attendee names popping up in real time.
7. As an enrolled attendee, I want to scan the Session QR code using my phone camera, so that I am taken directly to the check-in web application without installing a native mobile app.
8. As a first-time attendee, I want to find my name in the roster and confirm my identity using my registered phone number digits, so that no one else can claim my attendance.
9. As an attendee with a paired device, I want my smartphone to remember my member profile, so that subsequent check-ins across the event require only a single tap.
10. As a first-time visitor or guest not in the roster, I want to tap "Register as Guest" on the check-in page and enter my basic details, so that I can join the session immediately without waiting for coordinator approval.
11. As an attendee in a venue with poor cellular reception, I want my scan to queue optimistically and display a confirmed check-in screen, so that my check-in syncs automatically in the background once signal returns.
12. As a coordinator, I want a live session roster where I can manually toggle a member's status to Present, so that members without smartphones or with drained batteries are counted.
13. As a coordinator, I want to mark an absent member as Excused (e.g. medical or travel leave), so that their absence does not penalize their personal attendance rate.
14. As a coordinator, I want an analytics dashboard showing members categorized into "Most Present", "At-Risk / Most Absent", and "No Attendance" tiers, so that I know who needs pastoral or administrative follow-up.
15. As a coordinator, I want attendance rates calculated dynamically against elapsed non-excused sessions, so that members joining mid-season or excused members are graded fairly.
16. As a coordinator, I want to download a complete Attendance Matrix spreadsheet (CSV/Excel) with dates as columns and members as rows, so that I can maintain external organizational records.
17. As an attendee, I want immediate visual feedback if I scan a session that has already concluded or whose QR code has expired, so that I understand why check-in did not succeed.
18. As a coordinator, I want to close or lock a session once the entry window has passed, so that no further self-check-ins can be registered for that time slot.

## Implementation Decisions

### Architectural Decisions
- **Inverted QR Architecture (ADR 0001)**: The venue displays a single dynamic Session QR code; attendees scan using standard mobile browser cameras. Personal member QR badges are deprecated.
- **Ahead-of-Time Session Materialization (ADR 0002)**: Creating an Event with a Schedule Rule immediately materializes concrete `EventSession` rows in the database across the configured range. Attendance denominators equal the count of past materialized sessions minus any excused absences.
- **Lightweight Device Pairing (ADR 0003)**: On first scan, attendees verify identity against their pre-enrolled phone number. A cryptographically random pairing token is saved in `localStorage`, enabling 1-tap check-in on future scans.
- **Time-Rotating QR Tokens**: Session QR codes embed an encrypted or HMAC-signed time-based token (valid for a sliding 30-second window) alongside the session ID. The server rejects expired or forward-shared tokens.
- **Optimistic Client Queue**: The attendee web client stores scan payloads in IndexedDB/localStorage and retries sync with exponential backoff if the network request fails at the venue.

### Schema & Entity Changes
- **`Event` Entity**: Represents the top-level container (title, description, event type: `MULTI_DAY` or `RECURRING`).
- **`ScheduleRule` Entity**: Associated with `Event`, stores recurrence type (`DATE_RANGE` with start/end date, or `WEEKLY_DAYS` with day-of-week bitmask/array: e.g. Friday and Sunday).
- **`EventSession` Entity**: Materialized session instances linked to `Event`. Fields include session title, scheduled start/end datetime, active check-in window state (`SCHEDULED`, `ACTIVE`, `CONCLUDED`), and rotating QR secret salt.
- **`Member` Entity Updates**: Retains link to cohort/camp, adds phone number for pairing verification, and adds role/status (`CAMPER`, `COORDINATOR`, `GUEST`). The unique personal `qrCode` column becomes optional or removed.
- **`AttendanceRecord` Entity Updates**: Stores `sessionId`, `memberId`, `status` (`PRESENT`, `EXCUSED`, `ABSENT`), `source` (`SELF_SCAN`, `MANUAL_OVERRIDE`), and `scannedAt` timestamp.

### API Contracts
- `POST /api/events`: Creates an Event and ScheduleRule, synchronously generating upcoming `EventSession` records.
- `GET /api/events`: Lists active events with summary stats.
- `GET /api/events/[id]/calendar`: Returns all materialized sessions for date browsing, cancellation, or renaming.
- `GET /api/sessions/[id]/token`: Generates a rolling 30-second signed QR token for the coordinator display screen.
- `POST /api/sessions/checkin`: Validates the rolling QR token, checks device pairing or executes first-time phone verification, registers guests if unlisted, and records attendance.
- `PATCH /api/sessions/[id]/records`: Allows coordinators to manually update member status to `PRESENT`, `EXCUSED`, or `ABSENT`.
- `GET /api/events/[id]/analytics`: Computes member attendance rates (`Attended / (Elapsed - Excused) * 100%`), streaks, leaderboard tiers, and matrix rows.
- `GET /api/events/[id]/export`: Streams a generated CSV/Excel file representing the attendance matrix.

## Testing Decisions

### What Makes a Good Test
Tests must evaluate external observable behaviors through public interfaces rather than asserting private implementation states or internal variable values. A good test simulates a realistic caller (sending HTTP requests to Next.js Route Handlers and asserting status codes, returned JSON contracts, and database side-effects).

### Tested Modules
- **Route Handler Boundary (`app/api/**`)**:
  - Event and schedule generation routes (`POST /api/events`).
  - Rolling QR token generation and validation (`GET /api/sessions/[id]/token` and `POST /api/sessions/checkin`).
  - Verification of lightweight phone-number pairing on initial scan vs 1-tap check-in with cached device token.
  - Guest auto-registration when an unlisted visitor scans.
  - Rejection of expired rotating QR tokens and concluded session check-ins.
  - Manual override state toggling (`PATCH /api/sessions/[id]/records`).
  - Dynamic analytics computation verifying accurate handling of excused absences in the denominator.
  - Matrix export format and response headers.

### Prior Art
Existing Next.js route handlers in `app/api/attendance/scan/route.ts` and `app/api/members/route.ts` demonstrate request validation via Zod schemas and database interactions via Prisma. New tests will invoke route handler methods with mocked or isolated database fixtures.

## Out of Scope

- SMS Gateway integrations (verification uses on-device match against roster phone digits without paid SMS carriers).
- GPS / Geofencing enforcement (browser geolocation permission prompts cause high drop-off and fail indoors).
- Native iOS / Android app builds (all functionality runs in responsive mobile web browsers).
- Biometric authentication (facial recognition or fingerprint checks).
- Payment processing or ticketing fees.

## Further Notes

- Existing camp and member data from early deployments will be mapped into default `Event` and `Roster` records during migration.
- Coordinator display UI should feature a high-contrast full-screen toggle suitable for projectors and outdoor sunlight.

