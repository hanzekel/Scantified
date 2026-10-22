# 0002: Ahead-of-Time Session Materialization

## Context
Events require flexible scheduling: fixed multi-day events (e.g. 3-day camps) and recurring weekly events (e.g. Friday prayer & Sunday services, weekday classes). System analytics also require an accurate total session count to compute attendance and absence percentages.

## Decision
We decided to pre-generate concrete `EventSession` records up-front when an `Event` is created with its `ScheduleRule`. Organizers can preview their entire calendar, modify session titles, or delete/cancel specific instances (such as holidays or weather cancellations). Attendance analytics use materialized elapsed sessions as the denominator.

## Consequences & Trade-offs
- Organizers gain full visual calendar control to customize individual sessions before they occur.
- Creates database rows in advance across the event timeframe instead of dynamic on-the-fly generation.
- Changes to an event's recurring schedule require a clear recalculation strategy for future unstarted sessions.

