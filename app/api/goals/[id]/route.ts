import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };
const categories = new Set(["Fitness", "School", "Finance", "Career", "Personal", "Faith", "Custom"]);

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCategory(value: string | undefined) {
  return categories.has(value ?? "") ? value : "Personal";
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const { id } = await context.params;
  const body = (await request.json()) as { title?: string; description?: string; category?: string; targetValue?: number; currentValue?: number; unit?: string; targetDate?: string; status?: string };
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });

  const { error } = await supabase.from("goals").update({
    title,
    description: body.description?.trim() || null,
    category: normalizeCategory(body.category),
    target_value: toNumber(body.targetValue),
    current_value: toNumber(body.currentValue),
    unit: body.unit?.trim() || "",
    target_date: body.targetDate || null,
    status: body.status?.trim() || "active"
  }).eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const { id } = await context.params;
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id);

  if (error) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
