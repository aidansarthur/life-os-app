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

  const body = (await request.json()) as { title?: string; targetAmount?: number; currentAmount?: number; targetDate?: string };
  const title = body.title?.trim();
  const targetAmount = toMoney(body.targetAmount);

  if (!title || targetAmount <= 0) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { error } = await supabase.from("finance_goals").insert({
    user_id: user.id,
    title,
    target_amount: targetAmount,
    current_amount: Math.max(0, toMoney(body.currentAmount)),
    target_date: body.targetDate || null
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
