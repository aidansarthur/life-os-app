import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { fetchWhoopJson, WhoopApiError } from "@/lib/whoop-api";
import type { WhoopRecoveryTrendPoint } from "@/lib/whoop-dashboard-types";

type WhoopRecordResponse = {
  records?: unknown[];
};

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

function sleepTrendFrom(response: WhoopRecordResponse) {
  return (response.records ?? [])
    .map((record, index) => ({
      date: labelFromRecord(record, index),
      hoursSlept: sleepHoursFrom(record),
      sleepPerformance: getNestedNumber(record, ["score", "sleep_performance_percentage"])
    }))
    .reverse();
}

function recoveryTrendFrom(response: WhoopRecordResponse): WhoopRecoveryTrendPoint[] {
  return (response.records ?? [])
    .map((record, index) => {
      const recoveryScore = getNestedNumber(record, ["score", "recovery_score"]);
      if (recoveryScore === null) return null;
      return { date: labelFromRecord(record, index), recoveryScore };
    })
    .filter((point): point is WhoopRecoveryTrendPoint => point !== null)
    .reverse();
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 401 });
  }

  try {
    const recoveryResponse = await fetchWhoopJson<WhoopRecordResponse>(user.id, "/recovery", { searchParams: { limit: "7" } });
    const sleepResponse = await fetchWhoopJson<WhoopRecordResponse>(user.id, "/activity/sleep", { searchParams: { limit: "7" } });
    const cycleResponse = await fetchWhoopJson<WhoopRecordResponse>(user.id, "/cycle", { searchParams: { limit: "1" } }).catch(() => ({ records: [] }));
    const recovery = latestRecord(recoveryResponse);
    const sleep = latestRecord(sleepResponse);
    const cycle = latestRecord(cycleResponse);

    return NextResponse.json({
      ok: true,
      metrics: {
        recoveryScore: getNestedNumber(recovery, ["score", "recovery_score"]),
        hrv: getNestedNumber(recovery, ["score", "hrv_rmssd_milli"]),
        restingHeartRate: getNestedNumber(recovery, ["score", "resting_heart_rate"]),
        sleepPerformance: getNestedNumber(sleep, ["score", "sleep_performance_percentage"]),
        hoursSlept: sleepHoursFrom(sleep),
        sleepEfficiency: getNestedNumber(sleep, ["score", "sleep_efficiency_percentage"]),
        recoveryTrend: recoveryTrendFrom(recoveryResponse),
        sleepTrend: sleepTrendFrom(sleepResponse),
        strain: getNestedNumber(cycle, ["score", "strain"]),
        cycleStrain: getNestedNumber(cycle, ["score", "strain"])
      }
    });
  } catch (error) {
    if (error instanceof WhoopApiError && error.code === "not_connected") {
      return NextResponse.json({ ok: false, error: "not_connected" });
    }

    if (error instanceof WhoopApiError && error.code === "refresh_failed") {
      return NextResponse.json({ ok: false, error: "refresh_failed" }, { status: 401 });
    }

    if (error instanceof WhoopApiError && error.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
  }
}





