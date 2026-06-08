"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HeartPulse, Link2 } from "lucide-react";

type WhoopDashboardData = {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepPerformance: number | null;
  hoursSlept: number | null;
  sleepEfficiency: number | null;
};

type WhoopDashboardResponse =
  | { ok: true; metrics: WhoopDashboardData }
  | { ok: false; error: "not_connected" | "unauthorized" | "whoop_request_failed" };

type WidgetState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "error" }
  | { status: "connected"; metrics: WhoopDashboardData };

function formatPercent(value: number | null) {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "--" : `${Math.round(value)}${suffix}`;
}

function formatHours(value: number | null) {
  return value === null ? "--" : `${value.toFixed(1)}h`;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-[#f7f8f4] p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/45">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}

function WidgetShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <HeartPulse className="size-5 text-moss" />
        <h2 className="text-lg font-bold">WHOOP</h2>
      </div>
      {children}
    </section>
  );
}

export function WhoopDashboardWidget() {
  const [state, setState] = useState<WidgetState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    async function loadWhoopDashboard() {
      try {
        const response = await fetch("/api/whoop/dashboard", { cache: "no-store" });
        const body = (await response.json()) as WhoopDashboardResponse;

        if (!isMounted) return;

        if (body.ok) {
          setState({ status: "connected", metrics: body.metrics });
        } else if (body.error === "not_connected") {
          setState({ status: "not_connected" });
        } else {
          setState({ status: "error" });
        }
      } catch {
        if (isMounted) {
          setState({ status: "error" });
        }
      }
    }

    loadWhoopDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <WidgetShell>
        <p className="rounded-md bg-[#f7f8f4] p-3 text-sm font-semibold text-ink/60">Loading WHOOP data...</p>
      </WidgetShell>
    );
  }

  if (state.status === "not_connected") {
    return (
      <WidgetShell>
        <p className="leading-7 text-ink/70">Connect WHOOP to bring live recovery and sleep metrics into your Life OS dashboard.</p>
        <Link href="/api/whoop/connect" className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
          <Link2 className="size-4" />
          Connect WHOOP
        </Link>
      </WidgetShell>
    );
  }

  if (state.status === "error") {
    return (
      <WidgetShell>
        <p className="rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load WHOOP data</p>
      </WidgetShell>
    );
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <HeartPulse className="size-5 text-moss" />
          <h2 className="text-lg font-bold">WHOOP</h2>
        </div>
        <span className="rounded-md bg-mint px-2.5 py-1 text-xs font-bold text-moss">Connected</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricTile label="Recovery score" value={formatPercent(state.metrics.recoveryScore)} />
        <MetricTile label="HRV" value={formatNumber(state.metrics.hrv, " ms")} />
        <MetricTile label="Resting HR" value={formatNumber(state.metrics.restingHeartRate, " bpm")} />
        <MetricTile label="Sleep performance" value={formatPercent(state.metrics.sleepPerformance)} />
        <MetricTile label="Hours slept" value={formatHours(state.metrics.hoursSlept)} />
        <MetricTile label="Sleep efficiency" value={formatPercent(state.metrics.sleepEfficiency)} />
      </div>
    </section>
  );
}
