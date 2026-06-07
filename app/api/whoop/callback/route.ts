import { NextRequest, NextResponse } from "next/server";
import { saveWhoopTokens } from "@/lib/whoop-token-store";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_REDIRECT_URI = "https://life-os-app-lime.vercel.app/api/whoop/callback";

type WhoopTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/settings?whoop=error", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings?whoop=missing_code", origin));
  }

  const expectedState = request.cookies.get("whoop_oauth_state")?.value;
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/settings?whoop=invalid_state", origin));
  }

  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/settings?whoop=missing_credentials", origin));
  }

  try {
    const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: WHOOP_REDIRECT_URI,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/settings?whoop=token_error", origin));
    }

    const tokens = (await tokenResponse.json()) as WhoopTokenResponse;

    if (!tokens.access_token || !tokens.expires_in || !tokens.token_type) {
      return NextResponse.redirect(new URL("/settings?whoop=token_error", origin));
    }

    saveWhoopTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tokenType: tokens.token_type,
      savedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.redirect(new URL("/settings?whoop=token_error", origin));
  }

  // TODO: Replace the temporary token store with encrypted Supabase persistence.
  // TODO: Use the stored refresh token to renew WHOOP access before syncing data.
  // TODO: Fetch WHOOP health data in a separate sync route after storage is durable.
  const response = NextResponse.redirect(new URL("/settings?whoop=connected", origin));
  response.cookies.delete("whoop_oauth_state");

  return response;
}
