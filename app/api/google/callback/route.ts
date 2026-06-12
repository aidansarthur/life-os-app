import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { saveGoogleCalendarTokens } from "@/lib/google-calendar-token-store";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REDIRECT_URI = "https://life-os-app-lime.vercel.app/api/google/callback";

type GoogleTokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) return NextResponse.redirect(new URL("/calendar?google=error", origin));
  if (!code) return NextResponse.redirect(new URL("/calendar?google=missing_code", origin));

  const expectedState = request.cookies.get("google_oauth_state")?.value;
  if (!state || !expectedState || state !== expectedState) return NextResponse.redirect(new URL("/calendar?google=invalid_state", origin));

  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.redirect(new URL("/auth", origin));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/calendar?google=missing_credentials", origin));

  try {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
        client_id: clientId,
        client_secret: clientSecret
      }),
      cache: "no-store"
    });

    if (!tokenResponse.ok) return NextResponse.redirect(new URL("/calendar?google=token_error", origin));
    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;
    if (!tokens.access_token || !tokens.expires_in) return NextResponse.redirect(new URL("/calendar?google=token_error", origin));

    await saveGoogleCalendarTokens(user.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tokenType: tokens.token_type ?? "Bearer",
      scope: tokens.scope,
      savedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.redirect(new URL("/calendar?google=token_error", origin));
  }

  const response = NextResponse.redirect(new URL("/calendar?google=connected", origin));
  response.cookies.delete("google_oauth_state");
  return response;
}
