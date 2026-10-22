# 0004: Apple iOS Light Design System and Role-Split UX

## Context
Initial iterations used a dark neo-brutalist / dark-zinc UI with administrative tools grouped in a shared navigation bar. Users reported that the dark theme felt cold, developer-centric, and unsuitable for brightly lit sanctuaries, youth camps, and outdoors. Furthermore, mixing admin tools (export, excuses, roster creation) with attendee tasks (self check-in, pass retrieval) overwhelmed regular participants.

## Decision
1. **Light Mode as Core Visual Foundation**: Adopt a clean Apple iOS light aesthetic (`#F8F9FA` canvas background, `#FFFFFF` floating rounded cards with subtle drop shadows, deep slate typography `#1C1917`, and warm amber/gold accents `#D97706`).
2. **Apple Wallet Digital Pass**: Format attendee identity and self-check-in as a tactile digital pass featuring rounded borders, notch cutouts, attendance streak counter, and instant celebratory audio/haptic feedback.
3. **Role-Split Navigation**:
   - Floating segmented role switch pill (`Attendee` vs `Staff`).
   - Attendee Mode provides a mobile-first navigation for *My Pass*, *Check In*, and *Schedule*.
   - Staff Mode provides full coordinator tooling (*Projector Stage*, *Live Roster*, *People Directory*, *Reports*).
4. **Thumb-Friendly Contact Cards in Live Roster**: Replace dense spreadsheet tables with iOS contact cards and 1-tap segmented status pills (`Present`, `Excused`, `Absent`) with quick group filter pills.
5. **Theatrical Projector Stage**: The presentation screen strips away all web app chrome and navigation for sanctuary projectors, featuring a breathing QR code, live check-in ticker, and fullscreen toggle.
6. **Sensory Feedback with Mute Option**: Apple Pay-style two-tone audio chime and vibration for successful check-ins, accompanied by an accessible mute toggle for quiet sanctuary environments.

## Consequences & Trade-offs
- Provides high readability in bright church environments and aligns with familiar iOS interaction models.
- Cleanly shields regular attendees from complex administrative actions.
- Requires maintaining two distinct navigation and layout shells (Attendee vs. Coordinator).

