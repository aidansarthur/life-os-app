import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

function toMoney(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const body = (await request.json()) as { name?: string; type?: string; balance?: number };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { error } = await supabase.from("finance_accounts").insert({
    user_id: user.id,
    name,
    type: body.type?.trim() || "Checking",
    balance: toMoney(body.balance)
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
