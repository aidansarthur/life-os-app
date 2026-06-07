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

  // TODO: Validate the OAuth state value before trusting the authorization code.
  // TODO: Exchange the WHOOP authorization code for access and refresh tokens.
  // TODO: Store encrypted tokens for the signed-in user and schedule metric syncing.
  void state;

  return NextResponse.redirect(new URL("/settings?whoop=connected", origin));
}
