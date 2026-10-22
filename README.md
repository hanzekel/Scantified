# Scantified 🕊️📱

> **Church, Youth Camp & Ministry Attendance Made Seamless.**  
> Dynamic time-rotating QR self-check-in, Apple Wallet-style digital passes, offline sync, and real-time attendance analytics.

---

## 🌟 Overview

**Scantified** inverts traditional church and event attendance tracking. Instead of volunteers standing at the door scanning hundreds of printed paper badges or badges that campers lose, **a single dynamic QR code is projected onto the sanctuary or hall screen**. 

Attendees simply point their smartphone camera at the screen, tap once to confirm their presence, and receive instant tactile feedback with an Apple Wallet-style pass.

---

## ✨ Key Features

### 1. 🔄 Dynamic Time-Rotating QR Codes (Anti-Spoofing)
- The on-screen Session QR code automatically rotates every **20 seconds** with an HMAC SHA-256 cryptographic signature.
- Prevents attendees from photographing the code and texting it to absent friends.
- Built-in grace window to smoothly accommodate scanning and network latency.

### 2. 🪪 Apple Wallet-Style Digital Passes
- Attendees receive a beautiful, tactile member pass on their phone with ticket notch cutouts, group/camp badges, and attendance streaks.
- 1-tap **"Save to Photos"** button for quick verification by ushers.
- One-time lightweight phone verification pairs their phone for permanent 1-tap future check-ins.

### 3. 📶 Offline-First Resilient Sync Queue
- Campgrounds and sanctuaries often have weak cellular reception. Scantified queues scans in client storage with the authentic time window signature.
- Employs an **exponential backoff sync manager** that automatically flushes attendance records once connectivity returns without losing legitimate scans.

### 4. 🎭 Theatrical Projector Stage
- Fullscreen, distraction-free stage mode designed for TVs and venue projectors.
- Features a breathing golden halo, circular 20-second countdown ring, digital clock, and a real-time live arrival ticker displaying attendee names as they check in.
- 1-click **Theater View** toggle hides all coordinator controls for a clean broadcast experience.

### 5. 👥 Role-Split Experience (Attendee vs. Staff)
- **👤 Attendee Mode**: Clean, mobile-first interface featuring their personal digital pass, 1-tap self-check-in, and upcoming schedules. Includes a native iOS bottom tab bar on mobile.
- **⚡ Staff Coordinator Mode**: Full command center for launching projector sessions, live attendee lists with 1-tap override pills (`Present`, `Excused`, `Absent`), group directories, and reports.

### 6. 📊 Real-Time Analytics & Excel Matrix Export
- Dynamic denominator attendance rates: excused absences do not penalize members.
- **Mid-Season Joiner Fairness**: Automatically marks pre-enrollment sessions as `N/A` so new members are graded fairly.
- Tiered leaderboards (*Most Faithful*, *At-Risk / Needs Follow-Up*, *Haven't Attended Yet*).
- 1-click `.xlsx` spreadsheet download with sessions as columns and members as rows.

### 7. 🔔 Sensory Audio & Quiet-Service Mode
- Web Audio synthesizer arpeggio chime and haptic vibration for instant confirmation.
- 1-tap **Quiet Mode** mute button in the header for silent prayer and solemn services.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Database & ORM**: PostgreSQL with [Prisma ORM](https://www.prisma.io/) (Supabase connection pooler)
- **Styling & UI**: Tailwind CSS, Framer Motion, Native Apple SF Pro typography stack
- **Cryptography & Security**: Node.js `crypto` (HMAC SHA-256 sliding window tokens)
- **Audio & Haptics**: Web Audio API synthesizer + Navigator Vibration API
- **Reporting & QR**: `xlsx` (SheetJS), `qrcode`
- **Testing**: Automated unit and integration test runner (`tsx`)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.18+ or v20+
- A PostgreSQL database (e.g. [Supabase](https://supabase.com))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hanzekel/Scantified.git
   cd Scantified
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   # PostgreSQL connection string with connection pooler (e.g. Supabase port 6543)
   DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"

   # Direct database connection for migrations (port 5432)
   DIRECT_URL="postgresql://user:password@host:5432/postgres"

   # Secret salt for dynamic QR tokens
   SESSION_SECRET="your-secure-random-secret-key"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   *(Optional)* Seed sample camps and cohorts:
   ```bash
   npx prisma db seed
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated test suites covering scheduling generation, rotating token signatures, phone pairing, offline queue replay, manual overrides, and analytics formulas:

```bash
npm test
```

All 6 test suites run via `tsx` with comprehensive edge-case assertions.

---

## 📂 Project Structure

```text
├── app/
│   ├── api/                  # Route handlers (sessions, events, checkin, members, reports)
│   ├── checkin/              # Mobile self-check-in screen with camera & pairing
│   ├── events/               # Event creator, multi-day/weekly schedule generator
│   │   └── [id]/analytics/   # Attendance rate leaderboard, streak tracking, Excel export
│   ├── members/              # People directory, camp/cohort enrollment
│   ├── register/             # Public community sign-up & Apple Wallet digital pass
│   ├── reports/              # Live attendance monitor with 5s auto-sync
│   ├── scanner/              # Fallback camera scanner for ushers
│   └── sessions/[id]/
│       ├── dashboard/        # Coordinator live roster with 1-tap override pills
│       └── present/          # Projector stage with rotating QR halo & live ticker
├── components/
│   ├── app-navbar.tsx        # Role-split navigation (Attendee vs. Staff) & quiet mute
│   └── ui/                   # Reusable modal dialogs, toast notifications, audio chimes
├── lib/
│   ├── analytics.ts          # Pure analytics math, streaks, and dynamic denominators
│   ├── offline-queue.ts      # Offline scan storage & exponential backoff sync manager
│   ├── scheduling.ts         # Pre-materialized multi-day and recurring event generator
│   └── tokens.ts             # HMAC-SHA256 sliding window token generator & validator
├── prisma/
│   ├── migrations/           # SQL migration scripts
│   └── schema.prisma         # Event, Session, Member, Camp & Attendance schema
└── tests/                    # 6 automated test suites (scheduling, tokens, checkin, etc.)
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
