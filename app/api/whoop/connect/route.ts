import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const WHOOP_AUTHORIZE_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_REDIRECT_URI = "https://life-os-app-lime.vercel.app/api/whoop/callback";
const WHOOP_SCOPES = [
  "read:recovery",
  "read:sleep",
  "read:cycles",
  "read:workout",
  "read:profile",
  "offline"
].join(" ");

export function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect("https://life-os-app-lime.vercel.app/settings?whoop=missing_client_id");
  }

  const state = randomUUID();
  const authorizeUrl = new URL(WHOOP_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", WHOOP_REDIRECT_URI);
  authorizeUrl.searchParams.set("scope", WHOOP_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);

  // TODO: Replace this temporary state cookie with a signed/session-backed CSRF value.
  // TODO: Validate this state value in the callback before exchanging the code for tokens.
  response.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 10,
    path: "/"
  });

  return response;
}

