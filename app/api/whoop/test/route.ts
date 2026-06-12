import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { fetchWhoopJson, WhoopApiError } from "@/lib/whoop-api";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_connected" }, { status: 401 });
  }

  try {
    const profile = await fetchWhoopJson(user.id, "/user/profile/basic");
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    if (error instanceof WhoopApiError && error.code === "not_connected") {
      return NextResponse.json({ ok: false, error: "not_connected" });
    }

    if (error instanceof WhoopApiError && error.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
  }
}
