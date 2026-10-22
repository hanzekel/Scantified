# Ministry QR Attendance (Scantified)

QR-code based attendance tracking and analytics for ministries, camps, churches, and cohorts.

## Language

**Event**:
The parent container defining an activity, its schedule rules (multi-day or recurring), and its enrolled cohorts.
_Avoid_: Meeting, gathering, program

**EventSession**:
A concrete, date-and-time-stamped occurrence of an Event where attendance is captured.
_Avoid_: Attendance session, sub-event, class instance

**Session QR**:
A dynamic, time-rotating QR code displayed at the venue screen that attendees scan with their phone camera to self-check-in.
_Avoid_: Personal QR, member badge, static QR

**Roster**:
The pre-enrolled list of Members assigned to an Event, Camp, or Ministry group.
_Avoid_: User list, member pool, contact list

**Member**:
An enrolled participant, student, or attendee belonging to a Camp or Group.
_Avoid_: Account, client, user

**Guest**:
A first-time or unregistered attendee who self-registers upon scanning the Session QR.
_Avoid_: Visitor, anonymous user, walk-in

**Coordinator**:
A leader or administrator who creates events, displays the Session QR, manages manual overrides, and reviews analytics.
_Avoid_: Admin, host, teacher

**Device Pairing**:
The one-time process of binding a member's record to their personal smartphone's local storage using lightweight phone number verification.
_Avoid_: Account login, device registration

**Self-Check-In**:
The action performed by an attendee scanning the Session QR and confirming their identity from the roster on their device.
_Avoid_: Punch-in, manual log, badge scan

**Attendance Record**:
A verified link between a Member and an EventSession certifying presence (`PRESENT`, `EXCUSED`, or `ABSENT`).
_Avoid_: Sign-in slip, check-in row

**Excused Absence**:
An absence explicitly recorded by a coordinator that is excluded from the denominator in Attendance Rate calculations.
_Avoid_: Authorized leave, exempt absence

**Attendance Rate**:
The percentage of non-excused elapsed sessions in an event that a member has attended (`Attended / (Total Elapsed - Excused)`).
_Avoid_: Attendance score, presence percentage

**Schedule Rule**:
The recurrence pattern (specific date range or days of the week) used to pre-generate an Event's upcoming EventSessions.
_Avoid_: Recurrence setting, repeat frequency

**Optimistic Check-In**:
A client-side queue mechanism that verifies the dynamic QR signature locally and syncs the attendance record when connectivity returns.
_Avoid_: Offline buffer, pending upload

**Attendance Matrix**:
A tabular representation of attendance across all elapsed sessions with members as rows and session dates as columns.
_Avoid_: Attendance sheet, roll book

**Attendee Mode**:
The focused mobile interface for participants showing their digital pass, check-in actions, and attendance history without administrative controls.
_Avoid_: Public portal, student view

**Coordinator Mode**:
The management interface for leaders to broadcast the Projector Stage, handle manual overrides, enroll members, and export matrix reports.
_Avoid_: Admin dashboard, back office

**Digital Pass**:
An Apple Wallet-styled tactile pass on the attendee's phone representing their verified identity, group membership, and attendance badge.
_Avoid_: Virtual ID, e-card, member barcode

**Projector Stage**:
A distraction-free, fullscreen broadcast view designed for sanctuary projectors and TV displays featuring the rotating Session QR and live attendee ticker.
_Avoid_: Presentation tab, stage display, TV view
