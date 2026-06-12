"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEventSummary, CalendarEventsResponse } from "@/lib/calendar-types";

type CalendarStatus = "loading" | "ready" | "error";

export function useCalendarEvents() {
  const [today, setToday] = useState<CalendarEventSummary[]>([]);
  const [tomorrow, setTomorrow] = useState<CalendarEventSummary[]>([]);
  const [upcomingWeek, setUpcomingWeek] = useState<CalendarEventSummary[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<CalendarStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/calendar/events", { cache: "no-store" });
      const data = (await response.json()) as CalendarEventsResponse;
      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "google_request_failed" : data.error);
        return;
      }
      setConnected(data.connected);
      setToday(data.today);
      setTomorrow(data.tomorrow);
      setUpcomingWeek(data.upcomingWeek);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("google_request_failed");
    }
  }, []);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  return { today, tomorrow, upcomingWeek, connected, status, error, loadEvents };
}
