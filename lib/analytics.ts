// lib/analytics.ts

export interface SessionSummary {
  id: number;
  title: string;
  date: Date | string;
  sessionType: string;
  status: string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
}

export interface MemberAttendanceSummary {
  memberId: number;
  fullName: string;
  campName: string;
  role: string;
  attendedCount: number;
  excusedCount: number;
  absentCount: number;
  applicableCount: number;
  rate: number; // 0 - 100
  currentStreak: number;
  tier: "MOST_PRESENT" | "AT_RISK" | "NO_ATTENDANCE";
  sessionStatuses: Record<number, "P" | "E" | "A" | "N/A">;
}

export interface EventAnalyticsResult {
  summary: {
    totalSessions: number;
    elapsedSessions: number;
    totalMembers: number;
    averageAttendanceRate: number;
    perfectAttendanceCount: number;
    noAttendanceCount: number;
    atRiskCount: number;
  };
  sessions: SessionSummary[];
  tiers: {
    mostPresent: MemberAttendanceSummary[];
    atRisk: MemberAttendanceSummary[];
    noAttendance: MemberAttendanceSummary[];
  };
  allMembers: MemberAttendanceSummary[];
}

export interface MemberInput {
  id: number;
  fullName: string;
  campName: string;
  role: string;
  createdAt?: Date | string | null;
}

/**
 * Checks whether an event session has genuinely elapsed.
 * A session has elapsed if:
 * 1. It is explicitly concluded or active.
 * 2. Or, if scheduled, the entire calendar day or configured end time has completed in the past.
 */
export function isSessionElapsed(s: SessionSummary, now = Date.now()): boolean {
  if (s.status === "CONCLUDED" || s.status === "ACTIVE") return true;
  if (s.status === "CANCELLED") return false;

  const sessionDate = new Date(s.date);
  
  // If session has an explicit endTime, check if now is past endTime
  if (s.endTime) {
    const endDateTime = new Date(s.endTime);
    if (!isNaN(endDateTime.getTime())) {
      return endDateTime.getTime() <= now;
    }
  }

  // Otherwise, only treat as elapsed if yesterday or earlier (day has ended)
  const endOfDay = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    23,
    59,
    59,
    999
  ).getTime();

  return endOfDay < now;
}

/**
 * Pure calculation function for event attendance analytics.
 * Supports dynamic denominators, excused deductions, and fair mid-season joiner grading.
 */
export function calculateEventAnalytics(
  allSessions: SessionSummary[],
  members: MemberInput[],
  records: { sessionId: number; memberId: number; status: string }[],
  referenceNow = Date.now()
): EventAnalyticsResult {
  // Only non-cancelled sessions count
  const validSessions = allSessions.filter((s) => s.status !== "CANCELLED");

  // Determine elapsed sessions accurately
  const elapsedSessions = validSessions
    .filter((s) => isSessionElapsed(s, referenceNow))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fast lookup index: recordKey -> status
  const recordMap = new Map<string, string>();
  for (const r of records) {
    recordMap.set(`${r.sessionId}:${r.memberId}`, r.status);
  }

  const memberSummaries: MemberAttendanceSummary[] = members.map((member) => {
    let attended = 0;
    let excused = 0;
    let applicable = 0;
    const sessionStatuses: Record<number, "P" | "E" | "A" | "N/A"> = {};

    // Member registration calendar boundary for mid-season joiners
    const memberJoinDate = member.createdAt ? new Date(member.createdAt) : null;
    const memberStartOfDay = memberJoinDate
      ? new Date(memberJoinDate.getFullYear(), memberJoinDate.getMonth(), memberJoinDate.getDate()).getTime()
      : 0;

    for (const s of elapsedSessions) {
      const sDate = new Date(s.date);
      const sessionDayStart = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()).getTime();

      // If session occurred strictly before member enrolled, mark N/A and do not penalize
      if (memberStartOfDay > 0 && sessionDayStart < memberStartOfDay) {
        sessionStatuses[s.id] = "N/A";
        continue;
      }

      const status = recordMap.get(`${s.id}:${member.id}`);
      if (status === "PRESENT") {
        attended++;
        applicable++;
        sessionStatuses[s.id] = "P";
      } else if (status === "EXCUSED") {
        excused++;
        // Excused absences are excluded from the attendance rate denominator
        sessionStatuses[s.id] = "E";
      } else {
        applicable++;
        sessionStatuses[s.id] = "A";
      }
    }

    const absent = Math.max(0, applicable - attended);
    const rate = applicable > 0 ? Math.round((attended / applicable) * 100) : 0;

    // Calculate streak (consecutive P from latest applicable elapsed session backward)
    let streak = 0;
    for (let i = elapsedSessions.length - 1; i >= 0; i--) {
      const s = elapsedSessions[i];
      const status = sessionStatuses[s.id];
      if (status === "P") {
        streak++;
      } else if (status === "E" || status === "N/A") {
        // Excused and pre-enrollment sessions do not break streak
        continue;
      } else {
        break;
      }
    }

    // Determine Tier
    let tier: "MOST_PRESENT" | "AT_RISK" | "NO_ATTENDANCE";
    if (applicable === 0) {
      tier = attended > 0 ? "MOST_PRESENT" : "NO_ATTENDANCE";
    } else if (attended === 0) {
      tier = "NO_ATTENDANCE";
    } else if (rate < 50) {
      tier = "AT_RISK";
    } else {
      tier = "MOST_PRESENT";
    }

    return {
      memberId: member.id,
      fullName: member.fullName,
      campName: member.campName,
      role: member.role,
      attendedCount: attended,
      excusedCount: excused,
      absentCount: absent,
      applicableCount: applicable,
      rate,
      currentStreak: streak,
      tier,
      sessionStatuses,
    };
  });

  // Sort tiers
  const mostPresent = memberSummaries
    .filter((m) => m.tier === "MOST_PRESENT")
    .sort((a, b) => b.rate - a.rate || b.currentStreak - a.currentStreak || b.attendedCount - a.attendedCount);

  const atRisk = memberSummaries
    .filter((m) => m.tier === "AT_RISK")
    .sort((a, b) => a.rate - b.rate || b.absentCount - a.absentCount);

  const noAttendance = memberSummaries
    .filter((m) => m.tier === "NO_ATTENDANCE")
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Compute overall summary stats
  const totalRateSum = memberSummaries.reduce((sum, m) => sum + m.rate, 0);
  const avgRate = memberSummaries.length > 0 ? Math.round(totalRateSum / memberSummaries.length) : 0;
  const perfectCount = memberSummaries.filter((m) => m.rate === 100 && m.applicableCount > 0).length;

  return {
    summary: {
      totalSessions: validSessions.length,
      elapsedSessions: elapsedSessions.length,
      totalMembers: members.length,
      averageAttendanceRate: avgRate,
      perfectAttendanceCount: perfectCount,
      noAttendanceCount: noAttendance.length,
      atRiskCount: atRisk.length,
    },
    sessions: elapsedSessions,
    tiers: {
      mostPresent,
      atRisk,
      noAttendance,
    },
    allMembers: memberSummaries,
  };
}
