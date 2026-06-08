import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export const AUTH_ACCESS_COOKIE = "life_os_access_token";
export const AUTH_REFRESH_COOKIE = "life_os_refresh_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export type LifeOsUser = Pick<User, "id" | "email">;

function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function setAuthCookies(response: NextResponse, session: Session) {
  response.cookies.set(AUTH_ACCESS_COOKIE, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in
  });

  response.cookies.set(AUTH_REFRESH_COOKIE, session.refresh_token, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(AUTH_REFRESH_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export async function getUserFromAccessToken(accessToken?: string | null): Promise<LifeOsUser | null> {
  const env = supabaseEnv();
  if (!env || !accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: env.anonKey
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    const user = (await response.json()) as User;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(request: NextRequest) {
  return getUserFromAccessToken(request.cookies.get(AUTH_ACCESS_COOKIE)?.value);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  return getUserFromAccessToken(cookieStore.get(AUTH_ACCESS_COOKIE)?.value);
}
