import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { fetchGoogleCalendarEvents, GoogleCalendarError } from "@/lib/google-calendar-api";

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function inRange(value: string, start: Date, end: Date) {
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const todayStart = startOfDay(new Date());
  const tomorrowStart = addDays(todayStart, 1);
  const dayAfterTomorrow = addDays(todayStart, 2);
  const weekEnd = addDays(todayStart, 7);

  try {
    const events = await fetchGoogleCalendarEvents(user.id, todayStart, weekEnd);
    return NextResponse.json({
      ok: true,
      connected: true,
      today: events.filter((event) => inRange(event.startAt, todayStart, tomorrowStart)),
      tomorrow: events.filter((event) => inRange(event.startAt, tomorrowStart, dayAfterTomorrow)),
      upcomingWeek: events
    });
  } catch (error) {
    if (error instanceof GoogleCalendarError && error.code === "not_connected") {
      return NextResponse.json({ ok: true, connected: false, today: [], tomorrow: [], upcomingWeek: [] });
    }

    if (error instanceof GoogleCalendarError && error.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: "google_request_failed" }, { status: 502 });
  }
}
