import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { fetchWhoopJson, WhoopApiError } from "@/lib/whoop-api";

const RECENT_LIMIT = "5";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 401 });
  }

  try {
    const recovery = await fetchWhoopJson(user.id, "/recovery", { searchParams: { limit: RECENT_LIMIT } });
    const sleep = await fetchWhoopJson(user.id, "/activity/sleep", { searchParams: { limit: RECENT_LIMIT } });
    const cycles = await fetchWhoopJson(user.id, "/cycle", { searchParams: { limit: RECENT_LIMIT } });
    const workouts = await fetchWhoopJson(user.id, "/activity/workout", { searchParams: { limit: RECENT_LIMIT } });

    return NextResponse.json({ ok: true, recovery, sleep, cycles, workouts });
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

