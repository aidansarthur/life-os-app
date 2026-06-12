import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchWhoopJson } from "@/lib/whoop-api";
import type { WeeklyReport } from "@/lib/weekly-report-types";

type WhoopRecordResponse = { records?: unknown[] };
type HabitRow = { id: string; title: string };
type CompletionRow = { habit_id: string; completed_at: string };
type GoalRow = { id: string; title: string; progress: number | string };
type TaskRow = { title: string; due_date: string | null; status: string; updated_at: string };
type AccountRow = { balance: number | string };
type TransactionRow = { amount: number | string; category: string; transaction_date: string };
type FinanceGoalRow = { title: string; target_amount: number | string; current_amount: number | string };
type LongGoalRow = { title: string; target_value: number | string; current_value: number | string; target_date: string | null; status: string; updated_at: string };

type WhoopWeeklyMetrics = {
  averageRecovery: number | null;
  averageSleepPerformance: number | null;
  averageSleepHours: number | null;
  recoveryDays: number;
  sleepDays: number;
};

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

function average(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (!usable.length) return null;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function sleepHoursFrom(record: unknown) {
  const totalSleepMillis =
    getNestedNumber(record, ["score", "stage_summary", "total_sleep_time_milli"]) ??
    getNestedNumber(record, ["score", "stage_summary", "total_in_bed_time_milli"]);

  return totalSleepMillis === null ? null : totalSleepMillis / 1000 / 60 / 60;
}

async function getWhoopWeeklyMetrics(userId: string): Promise<WhoopWeeklyMetrics> {
  try {
    const [recoveryResponse, sleepResponse] = await Promise.all([
      fetchWhoopJson<WhoopRecordResponse>(userId, "/recovery", { searchParams: { limit: "7" } }),
      fetchWhoopJson<WhoopRecordResponse>(userId, "/activity/sleep", { searchParams: { limit: "7" } })
    ]);
    const recoveries = recoveryResponse.records ?? [];
    const sleeps = sleepResponse.records ?? [];

    return {
      averageRecovery: average(recoveries.map((record) => getNestedNumber(record, ["score", "recovery_score"]))),
      averageSleepPerformance: average(sleeps.map((record) => getNestedNumber(record, ["score", "sleep_performance_percentage"]))),
      averageSleepHours: average(sleeps.map((record) => sleepHoursFrom(record))),
      recoveryDays: recoveries.length,
      sleepDays: sleeps.length
    };
  } catch {
    return { averageRecovery: null, averageSleepPerformance: null, averageSleepHours: null, recoveryDays: 0, sleepDays: 0 };
  }
}

function buildWeeklyReport(input: {
  weekStart: string;
  weekEnd: string;
  whoop: WhoopWeeklyMetrics;
  habits: HabitRow[];
  completions: CompletionRow[];
  goals: GoalRow[];
  tasks: TaskRow[];
  accounts: AccountRow[];
  transactions: TransactionRow[];
  financeGoals: FinanceGoalRow[];
  longGoals: LongGoalRow[];
}): WeeklyReport {
  const uniqueCompletionKeys = new Set(input.completions.map((completion) => `${completion.habit_id}:${completion.completed_at.slice(0, 10)}`));
  const possibleHabitCompletions = input.habits.length * 7;
  const habitCompletionRate = possibleHabitCompletions ? Math.round((uniqueCompletionKeys.size / possibleHabitCompletions) * 100) : 0;
  const averageSchoolProgress = input.goals.length ? Math.round(input.goals.reduce((sum, goal) => sum + toNumber(goal.progress), 0) / input.goals.length) : 0;
  const activeTasks = input.tasks.filter((task) => task.status !== "completed");
  const completedTasks = input.tasks.filter((task) => task.status === "completed");
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < input.weekEnd);
  const totalBalance = input.accounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
  const income = input.transactions.filter((transaction) => toNumber(transaction.amount) > 0).reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const expenses = input.transactions.filter((transaction) => toNumber(transaction.amount) < 0 && transaction.category.toLowerCase() !== "savings").reduce((sum, transaction) => sum + Math.abs(toNumber(transaction.amount)), 0);
  const savings = input.transactions.filter((transaction) => toNumber(transaction.amount) < 0 && transaction.category.toLowerCase() === "savings").reduce((sum, transaction) => sum + Math.abs(toNumber(transaction.amount)), 0);
  const financeGoalProgress = input.financeGoals.length
    ? Math.round(input.financeGoals.reduce((sum, goal) => sum + (toNumber(goal.target_amount) ? Math.min(100, (toNumber(goal.current_amount) / toNumber(goal.target_amount)) * 100) : 0), 0) / input.financeGoals.length)
    : 0;
  const activeLongGoals = input.longGoals.filter((goal) => goal.status === "active");
  const goalProgressValues = activeLongGoals.map((goal) => toNumber(goal.target_value) ? Math.min(100, (toNumber(goal.current_value) / toNumber(goal.target_value)) * 100) : 0);
  const averageGoalProgress = goalProgressValues.length ? Math.round(goalProgressValues.reduce((sum, value) => sum + value, 0) / goalProgressValues.length) : 0;
  const biggestGoal = [...activeLongGoals].sort((a, b) => (toNumber(b.target_value) ? toNumber(b.current_value) / toNumber(b.target_value) : 0) - (toNumber(a.target_value) ? toNumber(a.current_value) / toNumber(a.target_value) : 0))[0];
  const neglectedGoal = [...activeLongGoals].sort((a, b) => (toNumber(a.target_value) ? toNumber(a.current_value) / toNumber(a.target_value) : 0) - (toNumber(b.target_value) ? toNumber(b.current_value) / toNumber(b.target_value) : 0))[0];
  const weeklyGoalProgress = activeLongGoals.length ? `${activeLongGoals.length} active long-term goal${activeLongGoals.length === 1 ? "" : "s"} averaged ${averageGoalProgress}% progress.` : "No active long-term goals were tracked this week.";

  const weeklyHealthSummary = input.whoop.averageRecovery === null && input.whoop.averageSleepPerformance === null
    ? "WHOOP weekly data is not available yet. Connect or refresh WHOOP to include recovery and sleep trends."
    : `You averaged ${input.whoop.averageRecovery ?? "unknown"}% recovery and ${input.whoop.averageSleepPerformance ?? "unknown"}% sleep performance across ${Math.max(input.whoop.recoveryDays, input.whoop.sleepDays)} tracked day${Math.max(input.whoop.recoveryDays, input.whoop.sleepDays) === 1 ? "" : "s"}.`;
  const schoolProgressSummary = input.goals.length
    ? `School goals averaged ${averageSchoolProgress}% progress. You completed ${completedTasks.length} task${completedTasks.length === 1 ? "" : "s"} and have ${activeTasks.length} active task${activeTasks.length === 1 ? "" : "s"}.`
    : "No school goals are set yet, so there is no weekly academic progress to summarize.";
  const financeSummary = `Accounts total $${Math.round(totalBalance)}. This week: $${Math.round(income)} income, $${Math.round(expenses)} expenses, $${Math.round(savings)} saved. Finance goals average ${financeGoalProgress}% complete.`;

  const winCandidates = [
    completedTasks.length ? `Completed ${completedTasks.length} school task${completedTasks.length === 1 ? "" : "s"}.` : "",
    habitCompletionRate >= 70 ? `Strong habit consistency at ${habitCompletionRate}%.` : "",
    (input.whoop.averageRecovery ?? 0) >= 70 ? `Solid recovery average at ${input.whoop.averageRecovery}%.` : "",
    savings > 0 ? `Saved $${Math.round(savings)} this week.` : "",
    biggestGoal ? `${biggestGoal.title} is the strongest long-term goal at ${Math.round(toNumber(biggestGoal.target_value) ? (toNumber(biggestGoal.current_value) / toNumber(biggestGoal.target_value)) * 100 : 0)}%.` : ""
  ].filter(Boolean);

  const concernCandidates = [
    overdueTasks.length ? `${overdueTasks.length} school task${overdueTasks.length === 1 ? " is" : "s are"} overdue or behind.` : "",
    habitCompletionRate > 0 && habitCompletionRate < 50 ? `Habit completion was low at ${habitCompletionRate}%.` : "",
    (input.whoop.averageRecovery ?? 100) < 50 ? `Recovery averaged only ${input.whoop.averageRecovery}%.` : "",
    expenses > income && income > 0 ? "Expenses were higher than income this week." : "",
    neglectedGoal && toNumber(neglectedGoal.target_value) > 0 && (toNumber(neglectedGoal.current_value) / toNumber(neglectedGoal.target_value)) * 100 < 30 ? `${neglectedGoal.title} is the most neglected long-term goal.` : ""
  ].filter(Boolean);

  const priorities: string[] = [];
  if ((input.whoop.averageRecovery ?? 100) < 55) priorities.push("Protect recovery with lighter training and earlier sleep for the first two days.");
  if (overdueTasks.length) priorities.push(`Clear overdue school work, starting with ${overdueTasks[0].title}.`);
  if (habitCompletionRate < 70 && input.habits.length) priorities.push("Pick the three most important habits and complete them before adding extra work.");
  if (input.financeGoals.length && financeGoalProgress < 60) priorities.push(`Make progress on ${input.financeGoals[0].title} and review spending categories.`);
  if (neglectedGoal) priorities.push(`Schedule one measurable action for ${neglectedGoal.title}.`);
  if (!priorities.length) priorities.push("Use the strong base for one training goal, one deep-work block, and one finance check-in.");
  priorities.push("Plan deadlines and training blocks before the week starts.");

  return {
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    weeklyHealthSummary,
    averageRecovery: input.whoop.averageRecovery,
    averageSleepPerformance: input.whoop.averageSleepPerformance,
    habitCompletionRate,
    schoolProgressSummary,
    financeSummary,
    weeklyGoalProgress,
    biggestGoalAchievement: biggestGoal ? `${biggestGoal.title} is at ${Math.round(toNumber(biggestGoal.target_value) ? (toNumber(biggestGoal.current_value) / toNumber(biggestGoal.target_value)) * 100 : 0)}% progress.` : "No goal achievement is available yet.",
    mostNeglectedGoal: neglectedGoal ? `${neglectedGoal.title} needs the most attention next week.` : "No neglected goal stands out yet.",
    biggestWin: winCandidates[0] || "You kept the system updated enough to generate a weekly review.",
    biggestConcern: concernCandidates[0] || "No major concern stands out from this week.",
    topPriorities: Array.from(new Set(priorities)).slice(0, 3)
  };
}

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const end = new Date();
  const start = addDays(end, -6);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  const weekStart = dateKey(start);
  const weekEnd = dateKey(end);

  const [whoop, habitsResult, completionsResult, goalsResult, tasksResult, accountsResult, transactionsResult, financeGoalsResult, longGoalsResult] = await Promise.all([
    getWhoopWeeklyMetrics(user.id),
    supabase.from("habits").select("id, title").eq("user_id", user.id),
    supabase.from("habit_completions").select("habit_id, completed_at").eq("user_id", user.id).gte("completed_at", start.toISOString()).lte("completed_at", end.toISOString()),
    supabase.from("school_goals").select("id, title, progress").eq("user_id", user.id),
    supabase.from("school_tasks").select("title, due_date, status, updated_at").eq("user_id", user.id).or(`status.neq.completed,updated_at.gte.${start.toISOString()}`).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("finance_accounts").select("balance").eq("user_id", user.id),
    supabase.from("finance_transactions").select("amount, category, transaction_date").eq("user_id", user.id).gte("transaction_date", weekStart).lte("transaction_date", weekEnd),
    supabase.from("finance_goals").select("title, target_amount, current_amount").eq("user_id", user.id),
    supabase.from("goals").select("title, target_value, current_value, target_date, status, updated_at").eq("user_id", user.id)
  ]);

  if (habitsResult.error || completionsResult.error || goalsResult.error || tasksResult.error || accountsResult.error || transactionsResult.error || financeGoalsResult.error || longGoalsResult.error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    report: buildWeeklyReport({
      weekStart,
      weekEnd,
      whoop,
      habits: habitsResult.data ?? [],
      completions: completionsResult.data ?? [],
      goals: goalsResult.data ?? [],
      tasks: tasksResult.data ?? [],
      accounts: accountsResult.data ?? [],
      transactions: transactionsResult.data ?? [],
      financeGoals: financeGoalsResult.data ?? [],
      longGoals: longGoalsResult.data ?? []
    })
  });
}


