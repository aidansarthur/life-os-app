import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";

function getSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAuthClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "missing_credentials" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return NextResponse.json({ ok: false, error: "signup_failed" }, { status: 400 });
  }

  if (!data.session) {
    return NextResponse.json({ ok: true, pendingConfirmation: true });
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, data.session);

  return response;
}
