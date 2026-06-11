import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { SchoolGoalSummary, SchoolTaskSummary } from "@/lib/school-types";

type GoalRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: "Low" | "Medium" | "High";
  progress: number;
  created_at: string;
  updated_at: string;
};

type TaskRow = {
  id: string;
  goal_id: string;
  title: string;
  due_date: string | null;
  priority: "Low" | "Medium" | "High";
  status: "open" | "completed";
  created_at: string;
  updated_at: string;
};

function clampProgress(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computedProgress(goal: GoalRow, tasks: TaskRow[]) {
  if (!tasks.length) return clampProgress(goal.progress);
  const done = tasks.filter((task) => task.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

function summarizeGoals(goals: GoalRow[], tasks: TaskRow[]): SchoolGoalSummary[] {
  const tasksByGoal = new Map<string, TaskRow[]>();

  for (const task of tasks) {
    const list = tasksByGoal.get(task.goal_id) ?? [];
    list.push(task);
    tasksByGoal.set(task.goal_id, list);
  }

  return goals.map((goal) => {
    const goalTasks = tasksByGoal.get(goal.id) ?? [];
    const summaries: SchoolTaskSummary[] = goalTasks.map((task) => ({
      id: task.id,
      goalId: task.goal_id,
      title: task.title,
      dueDate: task.due_date,
      priority: task.priority,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at
    }));

    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      progress: computedProgress(goal, goalTasks),
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      tasks: summaries
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

  const [{ data: goals, error: goalsError }, { data: tasks, error: tasksError }] = await Promise.all([
    supabase
      .from("school_goals")
      .select("id, title, description, category, priority, progress, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("school_tasks")
      .select("id, goal_id, title, due_date, priority, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
  ]);

  if (goalsError || tasksError) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, goals: summarizeGoals(goals ?? [], tasks ?? []) });
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

  const body = (await request.json()) as { title?: string; description?: string; category?: string; priority?: string; progress?: number };
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 400 });
  }

  const { error } = await supabase.from("school_goals").insert({
    user_id: user.id,
    title,
    description: body.description?.trim() || null,
    category: body.category?.trim() || "General",
    priority: body.priority?.trim() || "Medium",
    progress: clampProgress(body.progress ?? 0)
  });

  if (error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return GET(request);
}
