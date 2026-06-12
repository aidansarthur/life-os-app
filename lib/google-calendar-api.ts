import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getGoogleCalendarTokens, saveGoogleCalendarTokens, type GoogleCalendarTokenRecord } from "@/lib/google-calendar-token-store";
import type { CalendarEventSummary } from "@/lib/calendar-types";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export class GoogleCalendarError extends Error {
  constructor(readonly status: number, readonly code: "not_connected" | "unauthorized" | "google_request_failed") {
    super(code);
  }
}

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

type GoogleEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type GoogleEventsResponse = { items?: GoogleEvent[] };

function eventDate(value?: { dateTime?: string; date?: string }) {
  if (!value?.dateTime && !value?.date) return null;
  return value.dateTime ?? `${value.date}T00:00:00.000Z`;
}

function toSummary(event: GoogleEvent): CalendarEventSummary | null {
  const startAt = eventDate(event.start);
  if (!event.id || !startAt) return null;
  return {
    id: event.id,
    title: event.summary || "Untitled event",
    description: event.description ?? null,
    location: event.location ?? null,
    startAt,
    endAt: eventDate(event.end),
    status: event.status ?? null,
    htmlLink: event.htmlLink ?? null
  };
}

function authorization(tokens: GoogleCalendarTokenRecord) {
  return `${tokens.tokenType || "Bearer"} ${tokens.accessToken}`;
}

async function refreshGoogleTokens(ownerId: string, tokens: GoogleCalendarTokenRecord) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !tokens.refreshToken) throw new GoogleCalendarError(401, "unauthorized");

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken
    }),
    cache: "no-store"
  });

  if (!response.ok) throw new GoogleCalendarError(401, "unauthorized");
  const refreshed = (await response.json()) as GoogleTokenResponse;
  if (!refreshed.access_token || !refreshed.expires_in) throw new GoogleCalendarError(401, "unauthorized");

  const nextTokens: GoogleCalendarTokenRecord = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
    expiresIn: refreshed.expires_in,
    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    tokenType: refreshed.token_type ?? tokens.tokenType ?? "Bearer",
    scope: refreshed.scope ?? tokens.scope,
    savedAt: new Date().toISOString()
  };
  await saveGoogleCalendarTokens(ownerId, nextTokens);
  return nextTokens;
}

async function requestEvents(tokens: GoogleCalendarTokenRecord, start: Date, end: Date) {
  const url = new URL(GOOGLE_EVENTS_URL);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", start.toISOString());
  url.searchParams.set("timeMax", end.toISOString());

  const response = await fetch(url, { headers: { Authorization: authorization(tokens), Accept: "application/json" }, cache: "no-store" });
  if (response.status === 401) throw new GoogleCalendarError(401, "unauthorized");
  if (!response.ok) throw new GoogleCalendarError(response.status, "google_request_failed");
  return (await response.json()) as GoogleEventsResponse;
}

async function cacheEvents(ownerId: string, events: CalendarEventSummary[]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !events.length) return;
  await supabase.from("calendar_events").upsert(events.map((event) => ({
    owner_id: ownerId,
    google_event_id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    start_at: event.startAt,
    end_at: event.endAt,
    status: event.status,
    html_link: event.htmlLink
  })), { onConflict: "owner_id,google_event_id" });
}

export async function fetchGoogleCalendarEvents(ownerId: string, start: Date, end: Date) {
  const tokens = await getGoogleCalendarTokens(ownerId);
  if (!tokens?.accessToken) throw new GoogleCalendarError(401, "not_connected");

  try {
    const response = await requestEvents(tokens, start, end);
    const events = (response.items ?? []).map(toSummary).filter((event): event is CalendarEventSummary => event !== null);
    await cacheEvents(ownerId, events);
    return events;
  } catch (error) {
    if (!(error instanceof GoogleCalendarError) || error.status !== 401) throw error;
    const refreshed = await refreshGoogleTokens(ownerId, tokens);
    const response = await requestEvents(refreshed, start, end);
    const events = (response.items ?? []).map(toSummary).filter((event): event is CalendarEventSummary => event !== null);
    await cacheEvents(ownerId, events);
    return events;
  }
}
