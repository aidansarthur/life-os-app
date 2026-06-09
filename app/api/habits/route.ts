import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { HabitSummary } from "@/lib/habit-types";

type HabitRow = {
  id: string;
  title: string;
  description: string | null;
  target_frequency: string;
  created_at: string;
};

type CompletionRow = {
  habit_id: string;
  completed_at: string;
};

function dateKey(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}

function todayKey() {
  return dateKey(new Date());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function calculateStreak(completionDates: string[]) {
  const completed = new Set(completionDates);
  let cursor = new Date(`${todayKey()}T00:00:00.000Z`);
  let streak = 0;

  while (completed.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function summarizeHabits(habits: HabitRow[], completions: CompletionRow[]): HabitSummary[] {
  const completionsByHabit = new Map<string, string[]>();

  for (const completion of completions) {
    const list = completionsByHabit.get(completion.habit_id) ?? [];
    list.push(dateKey(completion.completed_at));
    completionsByHabit.set(completion.habit_id, list);
  }

  return habits.map((habit) => {
    const completionDates = Array.from(new Set(completionsByHabit.get(habit.id) ?? [])).sort().reverse();

    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      targetFrequency: habit.target_frequency,
      createdAt: habit.created_at,
      completedToday: completionDates.includes(todayKey()),
      streak: calculateStreak(completionDates),
      completionDates
    };
  });
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const [{ data: habits, error: habitsError }, { data: completions, error: completionsError }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, description, target_frequency, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString())
      .order("completed_at", { ascending: false })
  ]);

  if (habitsError || completionsError) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, habits: summarizeHabits(habits ?? [], completions ?? []) });
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

  const body = (await request.json()) as { title?: string; description?: string; targetFrequency?: string };
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    title,
    description: body.description?.trim() || null,
    target_frequency: body.targetFrequency?.trim() || "daily"
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return GET(request);
}
