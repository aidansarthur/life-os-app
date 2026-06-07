import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
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

  // TODO: Exchange the WHOOP authorization code for access and refresh tokens.
  // TODO: Store encrypted tokens for the signed-in user and schedule metric syncing.

  const response = NextResponse.redirect(new URL("/settings?whoop=connected", origin));
  response.cookies.delete("whoop_oauth_state");

  return response;
}
