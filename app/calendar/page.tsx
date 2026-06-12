"use client";

import { CalendarDays } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { useCalendarEvents } from "@/components/useCalendarEvents";
import type { CalendarEventSummary } from "@/lib/calendar-types";

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function CalendarPage() {
  const { today, tomorrow, upcomingWeek, connected, status, error } = useCalendarEvents();

  return (
    <>
      <SectionHeader eyebrow="Calendar" title="Schedule awareness">
        <a href="/api/google/connect" className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
          <CalendarDays className="size-4" />
          {connected ? "Reconnect Google" : "Connect Google Calendar"}
        </a>
      </SectionHeader>

      {status === "loading" ? <StatusCard message="Loading calendar events..." /> : null}
      {status === "error" ? <StatusCard message={`Unable to load calendar${error ? `: ${error}` : ""}.`} tone="error" /> : null}
      {status === "ready" && !connected ? <StatusCard message="Connect Google Calendar to show your schedule." /> : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <EventSection title="Today" events={today} />
        <EventSection title="Tomorrow" events={tomorrow} />
        <EventSection title="Upcoming week" events={upcomingWeek} />
      </div>
    </>
  );
}

function EventSection({ title, events }: { title: string; events: CalendarEventSummary[] }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      <div className="space-y-3">
        {events.length ? events.map((event) => (
          <article key={`${event.id}-${event.startAt}`} className="rounded-md border border-ink/10 px-3 py-2 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-ink">{event.title}</p>
              <span className="shrink-0 text-xs font-semibold text-moss">{timeLabel(event.startAt)}</span>
            </div>
            <p className="mt-1 text-ink/55">{event.location || event.description || "No details"}</p>
          </article>
        )) : <p className="text-sm font-semibold text-ink/55">No events.</p>}
      </div>
    </section>
  );
}

function StatusCard({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return <section className={`mb-6 rounded-lg border p-5 text-sm font-semibold shadow-soft ${tone === "error" ? "border-clay/20 bg-clay/10 text-clay" : "border-ink/10 bg-white text-ink/60"}`}>{message}</section>;
}
