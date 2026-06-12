import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_REDIRECT_URI = "https://life-os-app-lime.vercel.app/api/google/callback";
const GOOGLE_SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"].join(" ");

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.redirect("https://life-os-app-lime.vercel.app/auth");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect("https://life-os-app-lime.vercel.app/calendar?google=missing_client_id");

  const state = randomUUID();
  const url = new URL(GOOGLE_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  response.cookies.set("google_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 10, path: "/" });
  return response;
}
