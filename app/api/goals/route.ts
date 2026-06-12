import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { GoalCategory, GoalMilestoneSummary, GoalSummary } from "@/lib/goal-types";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_value: number | string;
  current_value: number | string;
  unit: string;
  target_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type MilestoneRow = {
  id: string;
  goal_id: string;
  title: string;
  target_value: number | string;
  completed: boolean;
  created_at: string;
};

const categories = new Set(["Fitness", "School", "Finance", "Career", "Personal", "Faith", "Custom"]);

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeCategory(value: string | undefined): GoalCategory {
  return categories.has(value ?? "") ? value as GoalCategory : "Personal";
}

function progressFor(goal: GoalRow) {
  const target = toNumber(goal.target_value);
  if (target <= 0) return 0;
  return clampPercent((toNumber(goal.current_value) / target) * 100);
}

function expectedProgress(goal: GoalRow) {
  if (!goal.target_date) return null;
  const start = new Date(goal.created_at).getTime();
  const target = new Date(`${goal.target_date}T23:59:59.999Z`).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(target) || target <= start) return null;
  return clampPercent(((now - start) / (target - start)) * 100);
}

function scheduleStatus(progress: number, expected: number | null) {
  if (expected === null) return "no_target" as const;
  if (progress + 10 < expected) return "behind" as const;
  if (progress >= expected + 10) return "ahead" as const;
  return "on_track" as const;
}

function summarizeGoals(goals: GoalRow[], milestones: MilestoneRow[]): GoalSummary[] {
  const milestonesByGoal = new Map<string, MilestoneRow[]>();
  for (const milestone of milestones) {
    const list = milestonesByGoal.get(milestone.goal_id) ?? [];
    list.push(milestone);
    milestonesByGoal.set(milestone.goal_id, list);
  }

  return goals.map((goal) => {
    const progress = progressFor(goal);
    const expected = expectedProgress(goal);
    const goalMilestones: GoalMilestoneSummary[] = (milestonesByGoal.get(goal.id) ?? []).map((milestone) => ({
      id: milestone.id,
      goalId: milestone.goal_id,
      title: milestone.title,
      targetValue: toNumber(milestone.target_value),
      completed: milestone.completed,
      createdAt: milestone.created_at
    }));

    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetValue: toNumber(goal.target_value),
      currentValue: toNumber(goal.current_value),
      unit: goal.unit,
      targetDate: goal.target_date,
      status: goal.status,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      progress,
      expectedProgress: expected,
      scheduleStatus: scheduleStatus(progress, expected),
      milestones: goalMilestones
    };
  });
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("id, title, description, category, target_value, current_value, unit, target_date, status, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (goalsError) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });

  const goalIds = (goals ?? []).map((goal) => goal.id);
  const { data: milestones, error: milestonesError } = goalIds.length
    ? await supabase.from("goal_milestones").select("id, goal_id, title, target_value, completed, created_at").in("goal_id", goalIds)
    : { data: [], error: null };

  if (milestonesError) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, goals: summarizeGoals(goals ?? [], milestones ?? []) });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const body = (await request.json()) as { title?: string; description?: string; category?: string; targetValue?: number; currentValue?: number; unit?: string; targetDate?: string; status?: string };
  const title = body.title?.trim();
  if (!title) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title,
    description: body.description?.trim() || null,
    category: normalizeCategory(body.category),
    target_value: toNumber(body.targetValue),
    current_value: toNumber(body.currentValue),
    unit: body.unit?.trim() || "",
    target_date: body.targetDate || null,
    status: body.status?.trim() || "active"
  });

  if (error) return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  return GET(request);
}

