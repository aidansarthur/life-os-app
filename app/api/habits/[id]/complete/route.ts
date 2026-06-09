import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function startOfTodayIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

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
  const { data: habit, error: habitError } = await supabase
    .from("habits")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (habitError || !habit) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 404 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("habit_id", id)
    .eq("user_id", user.id)
    .gte("completed_at", startOfTodayIso())
    .limit(1);

  if (existingError) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  if (!existing?.length) {
    const { error } = await supabase.from("habit_completions").insert({
      habit_id: id,
      user_id: user.id
    });

    if (error) {
      return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
