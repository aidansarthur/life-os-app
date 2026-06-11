"use client";

import { Activity, BookOpen, CalendarCheck, HeartPulse, PiggyBank } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ProgressBar } from "@/components/ProgressBar";
import { ReportCard } from "@/components/ReportCard";
import { StatCard } from "@/components/StatCard";
import { WhoopDashboardWidget } from "@/components/WhoopDashboardWidget";
import { useFinance } from "@/components/useFinance";
import { useHabits } from "@/components/useHabits";
import { useSchool } from "@/components/useSchool";
import { useWhoopDashboard } from "@/components/useWhoopDashboard";
import type { SchoolTaskSummary } from "@/lib/school-types";
import type { WhoopDashboardState } from "@/lib/whoop-dashboard-types";

type DashboardTask = SchoolTaskSummary & { goalTitle: string };

function formatPercent(value: number | null) {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function formatHours(value: number | null) {
  return value === null ? "--" : `${value.toFixed(1)}h`;
}

function formatHrv(value: number | null) {
  return value === null ? "--" : `${Math.round(value)} ms HRV`;
}

function formatMoney(value: number) {
  return `$${Math.round(value)}`;
}

function sleepRecoveryCard(state: WhoopDashboardState) {
  if (state.status === "connected") {
    return {
      value: formatPercent(state.metrics.recoveryScore),
      detail: `${formatHours(state.metrics.hoursSlept)} sleep, ${formatHrv(state.metrics.hrv)}`
    };
  }

  if (state.status === "loading") {
    return { value: "Loading", detail: "Fetching WHOOP recovery and sleep" };
  }

  if (state.status === "not_connected") {
    return { value: "Connect", detail: "Connect WHOOP for recovery and sleep" };
  }

  return { value: "--", detail: "Unable to load WHOOP data" };
}

function healthSnapshot(state: WhoopDashboardState) {
  if (state.status === "connected") {
    return `WHOOP: ${formatPercent(state.metrics.recoveryScore)} recovery, ${formatHours(state.metrics.hoursSlept)} slept, ${formatHrv(state.metrics.hrv)}, ${state.metrics.restingHeartRate === null ? "--" : `${Math.round(state.metrics.restingHeartRate)} bpm resting HR`}, and ${formatPercent(state.metrics.sleepEfficiency)} sleep efficiency.`;
  }

  if (state.status === "loading") return "WHOOP: loading recovery and sleep data.";
  if (state.status === "not_connected") return "WHOOP: connect your account to show live recovery, sleep, HRV, resting heart rate, and sleep efficiency.";
  return "WHOOP: unable to load recovery and sleep data right now.";
}

function recoveryTrendPanel({ state }: { state: WhoopDashboardState }) {
  if (state.status === "connected" && state.metrics.recoveryTrend.length > 0) {
    return <MiniBarChart data={state.metrics.recoveryTrend} valueKey="recoveryScore" label="Recovery trend" max={100} />;
  }

  const message = state.status === "loading"
    ? "Loading WHOOP recovery trend..."
    : state.status === "not_connected"
      ? "Connect WHOOP to show your real recovery trend."
      : "Unable to load WHOOP recovery trend.";

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="mb-4 text-sm font-bold text-ink">Recovery trend</p>
      <p className="rounded-md bg-[#f7f8f4] p-3 text-sm font-semibold text-ink/60">{message}</p>
    </section>
  );
}

function nextOpenTask(tasks: DashboardTask[]) {
  return tasks
    .filter((task) => task.status !== "completed")
    .sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"))[0];
}

export function DashboardClient() {
  const { habits, status: habitsStatus } = useHabits();
  const { goals, status: schoolStatus } = useSchool();
  const { summary: finance, goals: financeGoals, status: financeStatus } = useFinance();
  const whoopState = useWhoopDashboard();
  const sleepCard = sleepRecoveryCard(whoopState);
  const school = goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0;
  const schoolValue = schoolStatus === "loading" ? "Loading" : `${school}%`;
  const completedHabits = habits.filter((habit) => habit.completedToday).length;
  const habitScore = habits.length ? Math.round((completedHabits / habits.length) * 100) : 0;
  const habitDetail = habitsStatus === "loading"
    ? "Loading daily habits"
    : habits.length
      ? `${completedHabits} of ${habits.length} daily habits complete`
      : "No habits created yet";
  const habitValue = habitsStatus === "loading" ? "Loading" : `${habitScore}%`;
  const savingsGoal = financeGoals[0];
  const savingsProgress = savingsGoal?.targetAmount ? Math.min(100, Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100)) : 0;
  const allTasks = goals.flatMap((goal) => goal.tasks.map((task) => ({ ...task, goalTitle: goal.title })));
  const nextTask = nextOpenTask(allTasks);
  const recommendation = habitsStatus === "loading"
    ? "Loading your habit check-in now."
    : habits.length === 0
      ? "Add one habit you can actually repeat tomorrow. Keep the first version simple."
      : habitScore < 75
        ? "Start tomorrow with your first unfinished habit before the day gets crowded."
        : nextTask
          ? `Put one focused block on ${nextTask.goalTitle}: ${nextTask.title}.`
          : "Keep the plan simple tomorrow: habits, one focused study block, and a clean money check-in.";
  const habitSnapshot = habitsStatus === "loading"
    ? "Habits: loading today's completions."
    : habits.length
      ? `Habits: ${habitScore}% complete today (${completedHabits} of ${habits.length}).`
      : "Habits: no habits created yet.";
  const schoolSnapshot = schoolStatus === "loading" ? "School goals are loading." : `School goals are averaging ${school}% progress.`;
  const financeSnapshot = financeStatus === "loading"
    ? "Finances are loading."
    : `Finances: ${formatMoney(finance.monthlyIncome)} income, ${formatMoney(finance.monthlyExpenses)} expenses, ${formatMoney(finance.monthlySavings)} saved, and ${formatMoney(finance.monthlyBalance)} monthly balance.`;
  const snapshot = `${healthSnapshot(whoopState)} ${habitSnapshot} ${schoolSnapshot}${nextTask ? ` Next deadline: ${nextTask.title} for ${nextTask.goalTitle} on ${nextTask.dueDate ?? "no date"}.` : " No open school tasks right now."} ${financeSnapshot}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep / recovery" value={sleepCard.value} detail={sleepCard.detail} icon={HeartPulse} />
        <StatCard label="Habit completion" value={habitValue} detail={habitDetail} icon={CalendarCheck} tone="sky" />
        <StatCard label="School progress" value={schoolValue} detail={schoolStatus === "loading" ? "Loading school goals" : "Average progress across goals"} icon={BookOpen} tone="gold" />
        <StatCard label="Monthly balance" value={financeStatus === "loading" ? "Loading" : formatMoney(finance.monthlyBalance)} detail={financeStatus === "loading" ? "Loading finance data" : `${formatMoney(finance.monthlySavings)} saved this month`} icon={PiggyBank} tone="clay" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        {recoveryTrendPanel({ state: whoopState })}
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="size-5 text-moss" />
            <h2 className="text-lg font-bold">Daily AI report</h2>
          </div>
          <p className="leading-7 text-ink/75">{recommendation}</p>
          <div className="mt-5 space-y-4">
            <ProgressBar value={habitScore} label="Habits" />
            <ProgressBar value={school} label="School goals" />
            <ProgressBar value={savingsProgress} label={savingsGoal ? savingsGoal.title : "Savings target"} />
          </div>
        </section>
      </div>

      <div className="mt-6">
        <ReportCard title="Snapshot" body={snapshot} />
      </div>

      <div className="mt-6">
        <WhoopDashboardWidget state={whoopState} />
      </div>
    </>
  );
}
