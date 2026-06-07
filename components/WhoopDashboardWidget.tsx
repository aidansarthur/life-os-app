import Link from "next/link";
import { HeartPulse, Link2 } from "lucide-react";
import { getWhoopTokens } from "@/lib/whoop-token-store";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

type WhoopRecordResponse = {
  records?: unknown[];
};

type WhoopDashboardData = {
  recoveryScore: number | null;
  hrv: number | null;
  restingHeartRate: number | null;
  sleepPerformance: number | null;
  hoursSlept: number | null;
  sleepEfficiency: number | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNestedNumber(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return null;
    current = current[key];
  }
  return numberFrom(current);
}

function latestRecord(response: WhoopRecordResponse) {
  return response.records?.[0] ?? null;
}

async function fetchWhoopCollection(path: string, authorization: string) {
  const url = new URL(`${WHOOP_API_BASE}${path}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`WHOOP request failed with status ${response.status}`);
  }

  return (await response.json()) as WhoopRecordResponse;
}

function sleepHoursFrom(record: unknown) {
  const totalSleepMillis =
    getNestedNumber(record, ["score", "stage_summary", "total_sleep_time_milli"]) ??
    getNestedNumber(record, ["score", "stage_summary", "total_in_bed_time_milli"]);

  return totalSleepMillis === null ? null : totalSleepMillis / 1000 / 60 / 60;
}

async function getWhoopDashboardData(): Promise<WhoopDashboardData | null> {
  const tokens = getWhoopTokens();

  if (!tokens?.accessToken) {
    return null;
  }

  const authorization = `${tokens.tokenType} ${tokens.accessToken}`;
  const [recoveryResponse, sleepResponse] = await Promise.all([
    fetchWhoopCollection("/recovery", authorization),
    fetchWhoopCollection("/activity/sleep", authorization)
  ]);

  const recovery = latestRecord(recoveryResponse);
  const sleep = latestRecord(sleepResponse);

  return {
    recoveryScore: getNestedNumber(recovery, ["score", "recovery_score"]),
    hrv: getNestedNumber(recovery, ["score", "hrv_rmssd_milli"]),
    restingHeartRate: getNestedNumber(recovery, ["score", "resting_heart_rate"]),
    sleepPerformance: getNestedNumber(sleep, ["score", "sleep_performance_percentage"]),
    hoursSlept: sleepHoursFrom(sleep),
    sleepEfficiency: getNestedNumber(sleep, ["score", "sleep_efficiency_percentage"])
  };
}

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

export async function WhoopDashboardWidget() {
  const tokens = getWhoopTokens();

  if (!tokens?.accessToken) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <HeartPulse className="size-5 text-moss" />
          <h2 className="text-lg font-bold">WHOOP</h2>
        </div>
        <p className="leading-7 text-ink/70">Connect WHOOP to bring live recovery and sleep metrics into your Life OS dashboard.</p>
        <Link href="/api/whoop/connect" className="focus-ring mt-4 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
          <Link2 className="size-4" />
          Connect WHOOP
        </Link>
      </section>
    );
  }

  try {
    const data = await getWhoopDashboardData();

    if (!data) {
      return null;
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
          <MetricTile label="Recovery score" value={formatPercent(data.recoveryScore)} />
          <MetricTile label="HRV" value={formatNumber(data.hrv, " ms")} />
          <MetricTile label="Resting HR" value={formatNumber(data.restingHeartRate, " bpm")} />
          <MetricTile label="Sleep performance" value={formatPercent(data.sleepPerformance)} />
          <MetricTile label="Hours slept" value={formatHours(data.hoursSlept)} />
          <MetricTile label="Sleep efficiency" value={formatPercent(data.sleepEfficiency)} />
        </div>
      </section>
    );
  } catch {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <HeartPulse className="size-5 text-moss" />
          <h2 className="text-lg font-bold">WHOOP</h2>
        </div>
        <p className="rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load WHOOP data</p>
      </section>
    );
  }
}
