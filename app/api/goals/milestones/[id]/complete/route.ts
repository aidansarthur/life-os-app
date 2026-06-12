import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const { id } = await context.params;
  const { data: milestone, error: lookupError } = await supabase
    .from("goal_milestones")
    .select("id, goals!inner(user_id)")
    .eq("id", id)
    .eq("goals.user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (lookupError || !milestone) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 404 });

  const { error } = await supabase.from("goal_milestones").update({ completed: true }).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
