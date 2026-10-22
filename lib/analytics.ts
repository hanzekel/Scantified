export interface SessionSummary {
  id: number;
  title: string;
  date: Date;
  sessionType: string;
  status: string;
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
  sessionStatuses: Record<number, "P" | "E" | "A">;
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

/**
 * Pure calculation function for event attendance analytics
 */
export function calculateEventAnalytics(
  allSessions: SessionSummary[],
  members: { id: number; fullName: string; campName: string; role: string }[],
  records: { sessionId: number; memberId: number; status: string }[]
): EventAnalyticsResult {
  // Only non-cancelled sessions count
  const validSessions = allSessions.filter((s) => s.status !== "CANCELLED");

  // Determine elapsed sessions (date in past, or status active/concluded)
  const now = Date.now();
  const elapsedSessions = validSessions
    .filter((s) => new Date(s.date).getTime() <= now || s.status === "ACTIVE" || s.status === "CONCLUDED")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Fast lookup index: recordKey -> status
  const recordMap = new Map<string, string>();
  for (const r of records) {
    recordMap.set(`${r.sessionId}:${r.memberId}`, r.status);
  }

  const memberSummaries: MemberAttendanceSummary[] = members.map((member) => {
    let attended = 0;
    let excused = 0;
    const sessionStatuses: Record<number, "P" | "E" | "A"> = {};

    for (const s of elapsedSessions) {
      const status = recordMap.get(`${s.id}:${member.id}`);
      if (status === "PRESENT") {
        attended++;
        sessionStatuses[s.id] = "P";
      } else if (status === "EXCUSED") {
        excused++;
        sessionStatuses[s.id] = "E";
      } else {
        sessionStatuses[s.id] = "A";
      }
    }

    const applicable = Math.max(0, elapsedSessions.length - excused);
    const absent = Math.max(0, applicable - attended);
    const rate = applicable > 0 ? Math.round((attended / applicable) * 100) : 0;

    // Calculate streak (consecutive P from the latest elapsed session backward)
    let streak = 0;
    for (let i = elapsedSessions.length - 1; i >= 0; i--) {
      const s = elapsedSessions[i];
      const status = sessionStatuses[s.id];
      if (status === "P") {
        streak++;
      } else if (status === "E") {
        // Excused does not break streak
        continue;
      } else {
        break;
      }
    }

    // Determine Tier
    let tier: "MOST_PRESENT" | "AT_RISK" | "NO_ATTENDANCE";
    if (elapsedSessions.length === 0 || applicable === 0) {
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

