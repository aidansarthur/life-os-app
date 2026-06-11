import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getWhoopTokens } from "@/lib/whoop-token-store";
import type { DailyReport } from "@/lib/daily-report-types";

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

type HabitRow = { id: string; title: string };
type CompletionRow = { habit_id: string; completed_at: string };
type GoalRow = { id: string; title: string; progress: number };
type TaskRow = { title: string; due_date: string | null; status: string };
type AccountRow = { balance: number | string };
type FinanceGoalRow = { title: string; target_amount: number | string; current_amount: number | string };

type WhoopMetrics = {
  recoveryScore: number | null;
  hrv: number | null;
  sleepHours: number | null;
  restingHeartRate: number | null;
};

type WhoopRecordResponse = { records?: unknown[] };

class WhoopRequestError extends Error {
  constructor(readonly status: number) {
    super(`WHOOP request failed with status ${status}`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function numberFrom(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getNestedNumber(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!isObject(current)) return null;
    current = current[key];
  }
  return numberFrom(current);
}

function latestRecord(response: WhoopRecordResponse) {
  return response.records?.[0] ?? null;
}

function sleepHoursFrom(record: unknown) {
  const totalSleepMillis =
    getNestedNumber(record, ["score", "stage_summary", "total_sleep_time_milli"]) ??
    getNestedNumber(record, ["score", "stage_summary", "total_in_bed_time_milli"]);

  return totalSleepMillis === null ? null : totalSleepMillis / 1000 / 60 / 60;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function fetchWhoopCollection(path: string, authorization: string, limit: string) {
  const url = new URL(`${WHOOP_API_BASE}${path}`);
  url.searchParams.set("limit", limit);

  const response = await fetch(url, {
    headers: { Authorization: authorization, Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) throw new WhoopRequestError(response.status);
  return (await response.json()) as WhoopRecordResponse;
}

async function getWhoopMetrics(userId: string): Promise<WhoopMetrics> {
  const tokens = await getWhoopTokens(userId);
  if (!tokens?.accessToken) {
    return { recoveryScore: null, hrv: null, sleepHours: null, restingHeartRate: null };
  }

  try {
    const authorization = `${tokens.tokenType} ${tokens.accessToken}`;
    const [recoveryResponse, sleepResponse] = await Promise.all([
      fetchWhoopCollection("/recovery", authorization, "1"),
      fetchWhoopCollection("/activity/sleep", authorization, "1")
    ]);
    const recovery = latestRecord(recoveryResponse);
    const sleep = latestRecord(sleepResponse);

    return {
      recoveryScore: getNestedNumber(recovery, ["score", "recovery_score"]),
      hrv: getNestedNumber(recovery, ["score", "hrv_rmssd_milli"]),
      sleepHours: sleepHoursFrom(sleep),
      restingHeartRate: getNestedNumber(recovery, ["score", "resting_heart_rate"])
    };
  } catch {
    return { recoveryScore: null, hrv: null, sleepHours: null, restingHeartRate: null };
  }
}

function healthSummary(metrics: WhoopMetrics) {
  if (metrics.recoveryScore === null && metrics.sleepHours === null) {
    return "WHOOP is not connected or health data could not be loaded, so today's health recommendation is based on your tasks and habits only.";
  }

  const recovery = metrics.recoveryScore === null ? "unknown" : `${Math.round(metrics.recoveryScore)}%`;
  const sleep = metrics.sleepHours === null ? "unknown sleep" : `${metrics.sleepHours.toFixed(1)} hours slept`;
  const hrv = metrics.hrv === null ? "unknown HRV" : `${Math.round(metrics.hrv)} ms HRV`;
  const rhr = metrics.restingHeartRate === null ? "unknown resting heart rate" : `${Math.round(metrics.restingHeartRate)} bpm resting heart rate`;

  if ((metrics.recoveryScore ?? 100) < 50 || (metrics.sleepHours ?? 8) < 6) {
    return `Recovery is low today at ${recovery} with ${sleep}, ${hrv}, and ${rhr}. Keep training light, protect sleep tonight, and use shorter focused work blocks.`;
  }

  if ((metrics.recoveryScore ?? 0) >= 75 && (metrics.sleepHours ?? 0) >= 7) {
    return `Recovery looks strong at ${recovery} with ${sleep}, ${hrv}, and ${rhr}. This is a good day for training, deep work, and important school tasks.`;
  }

  return `Health is in a workable middle zone: ${recovery} recovery, ${sleep}, ${hrv}, and ${rhr}. Aim for steady effort without overloading the day.`;
}

function buildReport(input: {
  metrics: WhoopMetrics;
  habits: HabitRow[];
  completions: CompletionRow[];
  goals: GoalRow[];
  tasks: TaskRow[];
  accounts: AccountRow[];
  financeGoals: FinanceGoalRow[];
}): DailyReport {
  const today = dateKey(new Date());
  const soon = dateKey(addDays(new Date(), 2));
  const completedHabitIds = new Set(input.completions.filter((row) => row.completed_at.slice(0, 10) === today).map((row) => row.habit_id));
  const completedHabits = input.habits.filter((habit) => completedHabitIds.has(habit.id)).length;
  const habitRate = input.habits.length ? Math.round((completedHabits / input.habits.length) * 100) : 0;
  const activeTasks = input.tasks.filter((task) => task.status !== "completed");
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < today);
  const dueSoonTasks = activeTasks.filter((task) => task.due_date && task.due_date >= today && task.due_date <= soon);
  const schoolProgress = input.goals.length ? Math.round(input.goals.reduce((sum, goal) => sum + toNumber(goal.progress), 0) / input.goals.length) : 0;
  const totalBalance = input.accounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
  const savingsProgress = input.financeGoals.length
    ? Math.round(input.financeGoals.reduce((sum, goal) => sum + (toNumber(goal.target_amount) ? Math.min(100, (toNumber(goal.current_amount) / toNumber(goal.target_amount)) * 100) : 0), 0) / input.financeGoals.length)
    : 0;

  const productivitySummary = input.habits.length
    ? `You have completed ${completedHabits} of ${input.habits.length} habits today (${habitRate}%). ${activeTasks.length} school tasks are active, with ${overdueTasks.length} overdue and ${dueSoonTasks.length} due soon. School goals are averaging ${schoolProgress}% progress.`
    : `No habits are set up yet. ${activeTasks.length} school tasks are active, with ${overdueTasks.length} overdue and ${dueSoonTasks.length} due soon. School goals are averaging ${schoolProgress}% progress.`;
  const financeSummary = input.financeGoals.length
    ? `Your account balance total is $${Math.round(totalBalance)}. Finance goals are averaging ${savingsProgress}% complete across ${input.financeGoals.length} goal${input.financeGoals.length === 1 ? "" : "s"}.`
    : `Your account balance total is $${Math.round(totalBalance)}. No finance goals are set yet, so create one clear savings target to track progress.`;

  const priorities: string[] = [];
  if ((input.metrics.recoveryScore ?? 100) < 50 || (input.metrics.sleepHours ?? 8) < 6) priorities.push("Keep recovery first: light training, hydration, and an earlier bedtime.");
  if (overdueTasks.length) priorities.push(`Clear overdue school work, starting with ${overdueTasks[0].title}.`);
  if (!overdueTasks.length && dueSoonTasks.length) priorities.push(`Work ahead on ${dueSoonTasks[0].title}.`);
  if (habitRate < 75 && input.habits.length) priorities.push("Complete the next unfinished habit before adding new work.");
  if ((input.metrics.recoveryScore ?? 0) >= 75 && activeTasks.length <= 2) priorities.push("Use the strong recovery window for training and one deep-work block.");
  if (input.financeGoals.length && savingsProgress < 50) priorities.push(`Add progress toward ${input.financeGoals[0].title} or review spending today.`);
  priorities.push("Do a five-minute evening review so tomorrow starts clean.");

  let suggestedFocusLevel: DailyReport["suggestedFocusLevel"] = "Moderate";
  if ((input.metrics.recoveryScore ?? 100) < 50 || (input.metrics.sleepHours ?? 8) < 6) suggestedFocusLevel = "Low";
  if (((input.metrics.recoveryScore ?? 0) >= 75 && overdueTasks.length <= 1) || (overdueTasks.length >= 3 && (input.metrics.recoveryScore ?? 60) >= 55)) suggestedFocusLevel = "High";

  return {
    date: today,
    healthSummary: healthSummary(input.metrics),
    productivitySummary,
    financeSummary,
    topPriorities: Array.from(new Set(priorities)).slice(0, 3),
    suggestedFocusLevel
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const [metrics, habitsResult, completionsResult, goalsResult, tasksResult, accountsResult, financeGoalsResult] = await Promise.all([
    getWhoopMetrics(user.id),
    supabase.from("habits").select("id, title").eq("user_id", user.id),
    supabase.from("habit_completions").select("habit_id, completed_at").eq("user_id", user.id).gte("completed_at", since.toISOString()),
    supabase.from("school_goals").select("id, title, progress").eq("user_id", user.id),
    supabase.from("school_tasks").select("title, due_date, status").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("finance_accounts").select("balance").eq("user_id", user.id),
    supabase.from("finance_goals").select("title, target_amount, current_amount").eq("user_id", user.id)
  ]);

  if (habitsResult.error || completionsResult.error || goalsResult.error || tasksResult.error || accountsResult.error || financeGoalsResult.error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    report: buildReport({
      metrics,
      habits: habitsResult.data ?? [],
      completions: completionsResult.data ?? [],
      goals: goalsResult.data ?? [],
      tasks: tasksResult.data ?? [],
      accounts: accountsResult.data ?? [],
      financeGoals: financeGoalsResult.data ?? []
    })
  });
}
