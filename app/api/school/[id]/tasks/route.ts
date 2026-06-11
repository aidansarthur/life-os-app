import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const { id } = await context.params;
  const { data: goal, error: goalError } = await supabase
    .from("school_goals")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (goalError || !goal) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 404 });
  }

  const body = (await request.json()) as { title?: string; dueDate?: string; priority?: string };
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { error } = await supabase.from("school_tasks").insert({
    goal_id: id,
    user_id: user.id,
    title,
    due_date: body.dueDate || null,
    priority: body.priority?.trim() || "Medium",
    status: "open"
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
