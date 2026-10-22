import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateSessionsFromSchedule } from "@/lib/scheduling";

const createEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(100),
  description: z.string().optional(),
  eventType: z.enum(["MULTI_DAY", "RECURRING"]).default("RECURRING"),
  campId: z.number().int().positive().optional().nullable(),
  sessionType: z.string().default("Plenary"),
  schedule: z.object({
    ruleType: z.enum(["DATE_RANGE", "WEEKLY_DAYS"]),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
    daysOfWeek: z.array(z.string()).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }),
});

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        schedule: true,
        camp: true,
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createEventSchema.parse(body);

    // Generate materialized session drafts
    const sessionDrafts = generateSessionsFromSchedule(
      data.title,
      {
        ruleType: data.schedule.ruleType,
        startDate: data.schedule.startDate,
        endDate: data.schedule.endDate,
        daysOfWeek: data.schedule.daysOfWeek,
        startTime: data.schedule.startTime,
        endTime: data.schedule.endTime,
      },
      data.sessionType
    );

    if (sessionDrafts.length === 0) {
      return NextResponse.json(
        { error: "Schedule configuration resulted in 0 sessions. Check date range or selected days." },
        { status: 400 }
      );
    }

    // Create Event, ScheduleRule, and pre-materialize EventSessions in database
    const createdEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          title: data.title,
          description: data.description,
          eventType: data.eventType,
          campId: data.campId || null,
          schedule: {
            create: {
              ruleType: data.schedule.ruleType,
              startDate: new Date(data.schedule.startDate),
              endDate: new Date(data.schedule.endDate),
              daysOfWeek: data.schedule.daysOfWeek ? data.schedule.daysOfWeek.join(",") : null,
              startTime: data.schedule.startTime,
              endTime: data.schedule.endTime,
            },
          },
          sessions: {
            create: sessionDrafts.map((s) => ({
              title: s.title,
              date: s.date,
              startTime: s.startTime || null,
              endTime: s.endTime || null,
              eventDay: s.eventDay || null,
              sessionType: s.sessionType,
              status: s.status,
            })),
          },
        },
        include: {
          schedule: true,
          sessions: {
            orderBy: { date: "asc" },
          },
        },
      });

      return event;
    });

    return NextResponse.json(createdEvent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

