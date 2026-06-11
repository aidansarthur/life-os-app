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

  const body = (await request.json()) as { accountId?: string; description?: string; amount?: number; category?: string; transactionDate?: string; kind?: string };
  const accountId = body.accountId?.trim();
  const description = body.description?.trim();
  const category = body.category?.trim();
  const rawAmount = Math.abs(toMoney(body.amount));

  if (!accountId || !description || !category || rawAmount <= 0) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { data: account, error: accountError } = await supabase
    .from("finance_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (accountError || !account) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 404 });
  }

  const kind = body.kind === "Income" ? "Income" : body.kind === "Savings" ? "Savings" : "Expense";
  const amount = kind === "Income" ? rawAmount : -rawAmount;

  const { error } = await supabase.from("finance_transactions").insert({
    account_id: accountId,
    user_id: user.id,
    description,
    amount,
    category: kind === "Savings" ? "Savings" : category,
    transaction_date: body.transactionDate || new Date().toISOString().slice(0, 10)
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
