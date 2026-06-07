import { NextResponse } from "next/server";
import { getWhoopTokens } from "@/lib/whoop-token-store";

const WHOOP_PROFILE_URL = "https://api.prod.whoop.com/developer/v2/user/profile/basic";

export async function GET() {
  const tokens = getWhoopTokens();

  if (!tokens?.accessToken) {
    return NextResponse.json({ ok: false, error: "not_connected" });
  }

  try {
    const profileResponse = await fetch(WHOOP_PROFILE_URL, {
      headers: {
        Authorization: `${tokens.tokenType} ${tokens.accessToken}`,
        Accept: "application/json"
      }
    });

    if (profileResponse.status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (!profileResponse.ok) {
      return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
    }

    const profile = await profileResponse.json();

    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ ok: false, error: "whoop_request_failed" }, { status: 502 });
  }
}
