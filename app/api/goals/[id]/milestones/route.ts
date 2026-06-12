import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const { id } = await context.params;
  const { data: goal, error: goalError } = await supabase.from("goals").select("id").eq("id", id).eq("user_id", user.id).maybeSingle<{ id: string }>();
  if (goalError || !goal) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 404 });

  const body = (await request.json()) as { title?: string; targetValue?: number };
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });

  const { error } = await supabase.from("goal_milestones").insert({
    goal_id: id,
    title,
    target_value: toNumber(body.targetValue)
  });

  if (error) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
