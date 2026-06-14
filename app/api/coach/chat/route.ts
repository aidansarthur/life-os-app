import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { fetchGoogleCalendarEvents } from "@/lib/google-calendar-api";
import { fetchWhoopJson } from "@/lib/whoop-api";

type WhoopRecordResponse = { records?: unknown[] };
type HabitRow = { id: string; title: string };
type CompletionRow = { habit_id: string; completed_at: string };
type SchoolTaskRow = { title: string; due_date: string | null; status: string };
type SchoolGoalRow = { title: string; progress: number | string };
type AccountRow = { name: string; balance: number | string };
type TransactionRow = { amount: number | string; category: string; transaction_date: string };
type FinanceGoalRow = { title: string; target_amount: number | string; current_amount: number | string };
type LongGoalRow = { id: string; title: string; target_value: number | string; current_value: number | string; target_date: string | null; status: string };
type MilestoneRow = { goal_id: string; title: string; completed: boolean };
type CalendarEventRow = { title: string; startAt: string; endAt: string | null };

type WhoopMetrics = { recoveryScore: number | null; hrv: number | null; sleepHours: number | null; restingHeartRate: number | null };

type CoachContext = {
  whoop: WhoopMetrics;
  habits: HabitRow[];
  completions: CompletionRow[];
  schoolGoals: SchoolGoalRow[];
  schoolTasks: SchoolTaskRow[];
  accounts: AccountRow[];
  transactions: TransactionRow[];
  financeGoals: FinanceGoalRow[];
  longGoals: LongGoalRow[];
  milestones: MilestoneRow[];
  calendarEvents: CalendarEventRow[];
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

function latestRecord(response: WhoopRecordResponse) {
  return response.records?.[0] ?? null;
}

function sleepHoursFrom(record: unknown) {
  const totalSleepMillis = getNestedNumber(record, ["score", "stage_summary", "total_sleep_time_milli"]) ?? getNestedNumber(record, ["score", "stage_summary", "total_in_bed_time_milli"]);
  return totalSleepMillis === null ? null : totalSleepMillis / 1000 / 60 / 60;
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function getWhoopMetrics(userId: string): Promise<WhoopMetrics> {
  try {
    const [recoveryResponse, sleepResponse] = await Promise.all([
      fetchWhoopJson<WhoopRecordResponse>(userId, "/recovery", { searchParams: { limit: "1" } }),
      fetchWhoopJson<WhoopRecordResponse>(userId, "/activity/sleep", { searchParams: { limit: "1" } })
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

function goalProgress(goal: LongGoalRow | FinanceGoalRow) {
  const target = "target_value" in goal ? toNumber(goal.target_value) : toNumber(goal.target_amount);
  const current = "current_value" in goal ? toNumber(goal.current_value) : toNumber(goal.current_amount);
  return target > 0 ? Math.round(Math.min(100, (current / target) * 100)) : 0;
}

function buildSignals(context: CoachContext) {
  const today = dateKey(new Date());
  const soon = dateKey(addDays(new Date(), 2));
  const completedHabitIds = new Set(context.completions.filter((row) => row.completed_at.slice(0, 10) === today).map((row) => row.habit_id));
  const completedHabits = context.habits.filter((habit) => completedHabitIds.has(habit.id)).length;
  const habitRate = context.habits.length ? Math.round((completedHabits / context.habits.length) * 100) : 0;
  const activeTasks = context.schoolTasks.filter((task) => task.status !== "completed");
  const overdueTasks = activeTasks.filter((task) => task.due_date && task.due_date < today);
  const dueSoonTasks = activeTasks.filter((task) => task.due_date && task.due_date >= today && task.due_date <= soon);
  const schoolProgress = context.schoolGoals.length ? Math.round(context.schoolGoals.reduce((sum, goal) => sum + toNumber(goal.progress), 0) / context.schoolGoals.length) : 0;
  const accountTotal = context.accounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
  const activeGoals = context.longGoals.filter((goal) => goal.status === "active");
  const behindGoals = activeGoals.filter((goal) => goal.target_date && goal.target_date <= today && goalProgress(goal) < 100);
  const lowProgressGoal = [...activeGoals].sort((a, b) => goalProgress(a) - goalProgress(b))[0];
  const openMilestone = context.milestones.find((milestone) => !milestone.completed);
  const nextEvent = context.calendarEvents[0];

  return { today, completedHabits, habitRate, activeTasks, overdueTasks, dueSoonTasks, schoolProgress, accountTotal, activeGoals, behindGoals, lowProgressGoal, openMilestone, nextEvent };
}

function focusAnswer(context: CoachContext) {
  const s = buildSignals(context);
  const priorities: string[] = [];
  if ((context.whoop.recoveryScore ?? 100) < 50 || (context.whoop.sleepHours ?? 8) < 6) priorities.push("Protect recovery first: keep training light, hydrate, and use shorter work blocks.");
  if (s.overdueTasks.length) priorities.push(`Clear overdue school work, starting with ${s.overdueTasks[0].title}.`);
  if (!s.overdueTasks.length && s.dueSoonTasks.length) priorities.push(`Work ahead on ${s.dueSoonTasks[0].title}.`);
  if (s.nextEvent) priorities.push(`Plan around ${s.nextEvent.title} today.`);
  if (s.habitRate < 75 && context.habits.length) priorities.push("Complete the next unfinished habit before adding optional work.");
  if (s.lowProgressGoal) priorities.push(`Move ${s.lowProgressGoal.title} forward with one measurable step.`);
  priorities.push("End with a five-minute review so tomorrow starts clean.");
  return `Here is the best focus for today:\n\n${priorities.slice(0, 4).map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\nWhy: recovery is ${context.whoop.recoveryScore ?? "unknown"}%, habits are ${s.habitRate}% complete, you have ${s.overdueTasks.length} overdue task(s), and ${context.calendarEvents.length} calendar event(s) today.`;
}

function trainingAnswer(context: CoachContext) {
  const recovery = context.whoop.recoveryScore;
  const sleep = context.whoop.sleepHours;
  if (recovery === null && sleep === null) return "I do not have current WHOOP recovery or sleep data, so I cannot confidently judge training intensity. I can still use your schedule and tasks: keep training moderate if today is packed or school work is overdue.";
  if ((recovery ?? 100) < 50 || (sleep ?? 8) < 6) return `Go light today. Recovery is ${recovery ?? "unknown"}% and sleep is ${sleep === null ? "unknown" : `${sleep.toFixed(1)}h`}. Choose mobility, easy cardio, or technique work instead of a hard session.`;
  if ((recovery ?? 0) >= 75 && (sleep ?? 0) >= 7) return `Yes, today looks good for training. Recovery is ${recovery}% and sleep is ${sleep?.toFixed(1)}h. If your calendar allows it, this is a good day for a harder lift, soccer training, or deep conditioning.`;
  return `Train, but keep it controlled. Recovery is ${recovery ?? "unknown"}% and sleep is ${sleep === null ? "unknown" : `${sleep.toFixed(1)}h`}. A moderate session is smarter than forcing max intensity.`;
}

function behindAnswer(context: CoachContext) {
  const s = buildSignals(context);
  const items = [
    ...s.overdueTasks.map((task) => `School: ${task.title} is overdue.`),
    ...s.behindGoals.map((goal) => `Goal: ${goal.title} is behind its target date.`),
    ...(s.habitRate < 50 && context.habits.length ? [`Habits: only ${s.habitRate}% complete today.`] : []),
    ...context.financeGoals.filter((goal) => goalProgress(goal) < 50).map((goal) => `Finance: ${goal.title} is ${goalProgress(goal)}% funded.`)
  ];
  return items.length ? `Yes. These need attention:\n\n${items.slice(0, 6).map((item) => `- ${item}`).join("\n")}` : "Nothing major looks behind from the data I have. I checked school tasks, habits, long-term goals, and finance goals.";
}

function weekAnswer(context: CoachContext) {
  const s = buildSignals(context);
  const busy = context.calendarEvents.length >= 8 ? "busy" : context.calendarEvents.length >= 4 ? "moderate" : "open";
  return `Your week looks ${busy}. I see ${context.calendarEvents.length} upcoming calendar event(s), ${s.activeTasks.length} active school task(s), ${s.overdueTasks.length} overdue task(s), ${s.activeGoals.length} active long-term goal(s), and account balances totaling $${Math.round(s.accountTotal)}. Biggest watch item: ${s.overdueTasks[0]?.title ?? s.lowProgressGoal?.title ?? s.nextEvent?.title ?? "keep the system updated"}.`;
}

function dataLimits(context: CoachContext) {
  const missing = [];
  if (context.whoop.recoveryScore === null) missing.push("current WHOOP recovery");
  if (!context.calendarEvents.length) missing.push("calendar events");
  if (!context.habits.length) missing.push("habits");
  if (!context.schoolTasks.length) missing.push("school tasks");
  if (!context.accounts.length) missing.push("finance accounts");
  if (!context.longGoals.length) missing.push("long-term goals");
  return `I know your Life OS data: WHOOP when connected, habits, school, finance, long-term goals, and Google Calendar events. ${missing.length ? `I currently do not see ${missing.join(", ")}.` : "All major Life OS areas have data available."} I do not know anything outside this app, like private conversations, files, or plans you have not entered.`;
}

function answerQuestion(question: string, context: CoachContext) {
  const q = question.toLowerCase();
  if (q.includes("train") || q.includes("workout") || q.includes("lift") || q.includes("soccer")) return trainingAnswer(context);
  if (q.includes("behind") || q.includes("late") || q.includes("overdue")) return behindAnswer(context);
  if (q.includes("week")) return weekAnswer(context);
  if (q.includes("priority") || q.includes("focus") || q.includes("today") || q.includes("should i")) return focusAnswer(context);
  if (q.includes("know") || q.includes("data") || q.includes("outside")) return dataLimits(context);
  return `${focusAnswer(context)}\n\n${dataLimits(context)}`;
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) return NextResponse.json({ ok: false, error: "missing_message" }, { status: 400 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekEnd = addDays(todayStart, 7);
  const since = new Date(todayStart);

  const [whoop, calendarEvents, habitsResult, completionsResult, schoolGoalsResult, schoolTasksResult, accountsResult, transactionsResult, financeGoalsResult, longGoalsResult, milestonesResult] = await Promise.all([
    getWhoopMetrics(user.id),
    fetchGoogleCalendarEvents(user.id, todayStart, weekEnd).catch(() => []),
    supabase.from("habits").select("id, title").eq("user_id", user.id),
    supabase.from("habit_completions").select("habit_id, completed_at").eq("user_id", user.id).gte("completed_at", since.toISOString()),
    supabase.from("school_goals").select("title, progress").eq("user_id", user.id),
    supabase.from("school_tasks").select("title, due_date, status").eq("user_id", user.id).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("finance_accounts").select("name, balance").eq("user_id", user.id),
    supabase.from("finance_transactions").select("amount, category, transaction_date").eq("user_id", user.id).gte("transaction_date", dateKey(todayStart)),
    supabase.from("finance_goals").select("title, target_amount, current_amount").eq("user_id", user.id),
    supabase.from("goals").select("id, title, target_value, current_value, target_date, status").eq("user_id", user.id),
    supabase.from("goal_milestones").select("goal_id, title, completed")
  ]);

  if (habitsResult.error || completionsResult.error || schoolGoalsResult.error || schoolTasksResult.error || accountsResult.error || transactionsResult.error || financeGoalsResult.error || longGoalsResult.error || milestonesResult.error) {
    return NextResponse.json({ ok: false, error: "request_failed" }, { status: 500 });
  }

  const goalIds = new Set((longGoalsResult.data ?? []).map((goal) => goal.id));
  const context: CoachContext = {
    whoop,
    habits: habitsResult.data ?? [],
    completions: completionsResult.data ?? [],
    schoolGoals: schoolGoalsResult.data ?? [],
    schoolTasks: schoolTasksResult.data ?? [],
    accounts: accountsResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    financeGoals: financeGoalsResult.data ?? [],
    longGoals: longGoalsResult.data ?? [],
    milestones: (milestonesResult.data ?? []).filter((milestone) => goalIds.has(milestone.goal_id)),
    calendarEvents
  };

  return NextResponse.json({ ok: true, reply: answerQuestion(message, context) });
}
