export type CalendarEventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  status: string | null;
  htmlLink: string | null;
};

export type CalendarEventsResponse =
  | { ok: true; connected: true; today: CalendarEventSummary[]; tomorrow: CalendarEventSummary[]; upcomingWeek: CalendarEventSummary[] }
  | { ok: true; connected: false; today: []; tomorrow: []; upcomingWeek: [] }
  | { ok: false; error: "not_authenticated" | "google_request_failed" | "unauthorized" | "supabase_not_configured" };
