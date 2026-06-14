"use client";

import { Activity, HeartPulse, Moon, Timer, Waves } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { useWhoopDashboard } from "@/components/useWhoopDashboard";

function percent(value: number | null) {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function hours(value: number | null) {
  return value === null ? "--" : `${value.toFixed(1)}h`;
}

function numberLabel(value: number | null, suffix = "") {
  return value === null ? "--" : `${Math.round(value)}${suffix}`;
}

export default function HealthPage() {
  const whoop = useWhoopDashboard();

  return (
    <>
      <SectionHeader eyebrow="Health / WHOOP" title="Recovery and sleep trends">
        {whoop.status === "not_connected" ? <a href="/api/whoop/connect" className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">Connect WHOOP</a> : null}
      </SectionHeader>

      {whoop.status === "loading" ? <StatusCard message="Loading WHOOP data..." /> : null}
      {whoop.status === "not_connected" ? <StatusCard message="Connect WHOOP to show real recovery, sleep, HRV, resting heart rate, and strain data." /> : null}
      {whoop.status === "error" ? <StatusCard message={whoop.error === "refresh_failed" ? "Your WHOOP session expired. Reconnect WHOOP." : "Unable to load WHOOP data. Reconnect WHOOP if this keeps happening."} tone="error" actionLabel="Reconnect WHOOP" /> : null}

      {whoop.status === "connected" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard label="Recovery" value={percent(whoop.metrics.recoveryScore)} detail="WHOOP recovery" icon={HeartPulse} tone="sky" />
            <StatCard label="HRV" value={numberLabel(whoop.metrics.hrv, " ms")} detail="RMSSD" icon={Waves} tone="gold" />
            <StatCard label="Resting HR" value={numberLabel(whoop.metrics.restingHeartRate)} detail="Beats per minute" icon={Timer} tone="clay" />
            <StatCard label="Sleep duration" value={hours(whoop.metrics.hoursSlept)} detail="Last sleep" icon={Moon} />
            <StatCard label="Sleep performance" value={percent(whoop.metrics.sleepPerformance)} detail="WHOOP sleep score" icon={Moon} tone="sky" />
            <StatCard label="Strain" value={numberLabel(whoop.metrics.strain)} detail="Cycle strain" icon={Activity} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <MiniBarChart data={whoop.metrics.recoveryTrend} valueKey="recoveryScore" label="Recovery trend" max={100} />
            <MiniBarChart data={whoop.metrics.sleepTrend.map((point) => ({ date: point.date, hoursSlept: point.hoursSlept ?? 0 }))} valueKey="hoursSlept" label="Sleep duration trend" max={10} />
            <MiniBarChart data={whoop.metrics.sleepTrend.map((point) => ({ date: point.date, sleepPerformance: point.sleepPerformance ?? 0 }))} valueKey="sleepPerformance" label="Sleep performance trend" max={100} />
            <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-moss">WHOOP status</h2>
              <p className="leading-7 text-ink/75">Real WHOOP data is connected. Tokens refresh automatically before expiry and once after a WHOOP 401 response.</p>
              <p className="mt-3 text-sm font-semibold text-ink/55">Sleep efficiency: {percent(whoop.metrics.sleepEfficiency)}. Cycle strain: {numberLabel(whoop.metrics.cycleStrain)}.</p>
            </section>
          </div>
        </>
      ) : null}
    </>
  );
}

function StatusCard({ message, tone = "default", actionLabel }: { message: string; tone?: "default" | "error"; actionLabel?: string }) {
  return (
    <section className={`rounded-lg border p-5 text-sm font-semibold shadow-soft ${tone === "error" ? "border-clay/20 bg-clay/10 text-clay" : "border-ink/10 bg-white text-ink/60"}`}>
      <p>{message}</p>
      {actionLabel ? <a href="/api/whoop/connect" className="focus-ring mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">{actionLabel}</a> : null}
    </section>
  );
}



