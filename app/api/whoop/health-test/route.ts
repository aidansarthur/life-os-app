import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getWhoopTokens } from "@/lib/whoop-token-store";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";
const RECENT_LIMIT = "5";

const endpoints = {
  recovery: `${WHOOP_API_BASE}/recovery`,
  sleep: `${WHOOP_API_BASE}/activity/sleep`,
  cycles: `${WHOOP_API_BASE}/cycle`,
  workouts: `${WHOOP_API_BASE}/activity/workout`
};

class WhoopRequestError extends Error {
  constructor(readonly status: number) {
    super(`WHOOP request failed with status ${status}`);
  }
}

async function fetchWhoopCollection(url: string, authorization: string) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("limit", RECENT_LIMIT);

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: authorization,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new WhoopRequestError(response.status);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 401 });
  }

  const tokens = await getWhoopTokens(user.id);

  if (!tokens?.accessToken) {
    return NextResponse.json({ ok: false, error: "not_connected" });
  }

  const authorization = `${tokens.tokenType} ${tokens.accessToken}`;

  try {
    const [recovery, sleep, cycles, workouts] = await Promise.all([
      fetchWhoopCollection(endpoints.recovery, authorization),
      fetchWhoopCollection(endpoints.sleep, authorization),
      fetchWhoopCollection(endpoints.cycles, authorization),
      fetchWhoopCollection(endpoints.workouts, authorization)
    ]);

    return NextResponse.json({
      ok: true,
      recovery,
      sleep,
      cycles,
      workouts
    });
  } catch (error) {
    if (error instanceof WhoopRequestError && error.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
  }
}


