export type DayName =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export const DAY_MAP: Record<DayName, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface ScheduleInput {
  ruleType: "DATE_RANGE" | "WEEKLY_DAYS";
  startDate: Date | string;
  endDate: Date | string;
  daysOfWeek?: string[]; // e.g. ["FRIDAY", "SUNDAY"] or ["0", "5"]
  startTime?: string; // "HH:mm" e.g. "18:00"
  endTime?: string; // "HH:mm" e.g. "20:00"
}

export interface GeneratedSessionDraft {
  title: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  eventDay?: number;
  sessionType: string;
  status: "SCHEDULED";
}

function applyTimeToDate(baseDate: Date, timeStr?: string): Date | undefined {
  if (!timeStr || !timeStr.includes(":")) return undefined;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return undefined;
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Pure generator function to materialize EventSessions based on ScheduleRule
 */
export function generateSessionsFromSchedule(
  eventTitle: string,
  schedule: ScheduleInput,
  sessionType = "Plenary"
): GeneratedSessionDraft[] {
  const start = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end date");
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }

  const sessions: GeneratedSessionDraft[] = [];

  if (schedule.ruleType === "DATE_RANGE") {
    // Multi-day consecutive event (e.g. Day 1, Day 2, Day 3)
    let current = new Date(start);
    let dayCount = 1;

    while (current <= end) {
      sessions.push({
        title: `${eventTitle} - Day ${dayCount}`,
        date: new Date(current),
        startTime: applyTimeToDate(current, schedule.startTime),
        endTime: applyTimeToDate(current, schedule.endTime),
        eventDay: dayCount,
        sessionType,
        status: "SCHEDULED",
      });

      // advance by 1 day
      current.setDate(current.getDate() + 1);
      dayCount++;
    }
  } else if (schedule.ruleType === "WEEKLY_DAYS") {
    // Recurring on specific days of the week (e.g. Friday and Sunday)
    const targetDays = new Set<number>();

    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      for (const d of schedule.daysOfWeek) {
        const upper = d.trim().toUpperCase() as DayName;
        if (upper in DAY_MAP) {
          targetDays.add(DAY_MAP[upper]);
        } else {
          const num = parseInt(d, 10);
          if (!isNaN(num) && num >= 0 && num <= 6) {
            targetDays.add(num);
          }
        }
      }
    }

    if (targetDays.size === 0) {
      throw new Error("At least one day of week must be specified for recurring schedule");
    }

    let current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();

      if (targetDays.has(dayOfWeek)) {
        const dayName = DAY_NAMES[dayOfWeek];
        const dateStr = current.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        sessions.push({
          title: `${eventTitle} - ${dayName} (${dateStr})`,
          date: new Date(current),
          startTime: applyTimeToDate(current, schedule.startTime),
          endTime: applyTimeToDate(current, schedule.endTime),
          sessionType,
          status: "SCHEDULED",
        });
      }

      // advance by 1 day
      current.setDate(current.getDate() + 1);
    }
  }

  return sessions;
}
