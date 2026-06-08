import { NextResponse } from "next/server";
import { getWhoopTokens } from "@/lib/whoop-token-store";
import type { WhoopRecoveryTrendPoint } from "@/lib/whoop-dashboard-types";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

type WhoopRecordResponse = {
  records?: unknown[];
};

class WhoopRequestError extends Error {
  constructor(readonly status: number) {
    super(`WHOOP request failed with status ${status}`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringFrom(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getNestedNumber(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return null;
    current = current[key];
  }
  return numberFrom(current);
}

function getNestedString(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return null;
    current = current[key];
  }
  return stringFrom(current);
}

function latestRecord(response: WhoopRecordResponse) {
  return response.records?.[0] ?? null;
}

function sleepHoursFrom(record: unknown) {
  const totalSleepMillis =
    getNestedNumber(record, ["score", "stage_summary", "total_sleep_time_milli"]) ??
    getNestedNumber(record, ["score", "stage_summary", "total_in_bed_time_milli"]);

  return totalSleepMillis === null ? null : totalSleepMillis / 1000 / 60 / 60;
}

function labelFromRecord(record: unknown, index: number) {
  const rawDate =
    getNestedString(record, ["created_at"]) ??
    getNestedString(record, ["updated_at"]) ??
    getNestedString(record, ["start"]) ??
    getNestedString(record, ["end"]);

  if (!rawDate) return `R${index + 1}`;

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return `R${index + 1}`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function recoveryTrendFrom(response: WhoopRecordResponse): WhoopRecoveryTrendPoint[] {
  return (response.records ?? [])
    .map((record, index) => {
      const recoveryScore = getNestedNumber(record, ["score", "recovery_score"]);
      if (recoveryScore === null) return null;
      return {
        date: labelFromRecord(record, index),
        recoveryScore
      };
    })
    .filter((point): point is WhoopRecoveryTrendPoint => point !== null)
    .reverse();
}

async function fetchWhoopCollection(path: string, authorization: string, limit: string) {
  const url = new URL(`${WHOOP_API_BASE}${path}`);
  url.searchParams.set("limit", limit);

  const response = await fetch(url, {
    headers: {
      Authorization: authorization,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new WhoopRequestError(response.status);
  }

  return (await response.json()) as WhoopRecordResponse;
}

export async function GET() {
  const tokens = await getWhoopTokens();

  if (!tokens?.accessToken) {
    return NextResponse.json({ ok: false, error: "not_connected" });
  }

  const authorization = `${tokens.tokenType} ${tokens.accessToken}`;

  try {
    const [recoveryResponse, sleepResponse] = await Promise.all([
      fetchWhoopCollection("/recovery", authorization, "7"),
      fetchWhoopCollection("/activity/sleep", authorization, "1")
    ]);

    const recovery = latestRecord(recoveryResponse);
    const sleep = latestRecord(sleepResponse);

    return NextResponse.json({
      ok: true,
      metrics: {
        recoveryScore: getNestedNumber(recovery, ["score", "recovery_score"]),
        hrv: getNestedNumber(recovery, ["score", "hrv_rmssd_milli"]),
        restingHeartRate: getNestedNumber(recovery, ["score", "resting_heart_rate"]),
        sleepPerformance: getNestedNumber(sleep, ["score", "sleep_performance_percentage"]),
        hoursSlept: sleepHoursFrom(sleep),
        sleepEfficiency: getNestedNumber(sleep, ["score", "sleep_efficiency_percentage"]),
        recoveryTrend: recoveryTrendFrom(recoveryResponse)
      }
    });
  } catch (error) {
    if (error instanceof WhoopRequestError && error.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
  }
}
