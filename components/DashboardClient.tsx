"use client";

import { BookOpen, CalendarCheck, CalendarDays, Flag, HeartPulse, PiggyBank, Target } from "lucide-react";
import { DailyReportDashboardCard } from "@/components/DailyReportDashboardCard";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ReportCard } from "@/components/ReportCard";
import { StatCard } from "@/components/StatCard";
import { WhoopDashboardWidget } from "@/components/WhoopDashboardWidget";
import { useCalendarEvents } from "@/components/useCalendarEvents";
import { useFinance } from "@/components/useFinance";
import { useGoals } from "@/components/useGoals";
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
  const { today: todayEvents, connected: calendarConnected, status: calendarStatus } = useCalendarEvents();
  const { habits, status: habitsStatus } = useHabits();
  const { goals: lifeGoals, status: goalsStatus } = useGoals();
  const { goals, status: schoolStatus } = useSchool();
  const { summary: finance, status: financeStatus } = useFinance();
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
  const activeGoals = lifeGoals.filter((goal) => goal.status === "active");
  const averageGoalProgress = activeGoals.length ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length) : 0;
  const closestMilestone = activeGoals.flatMap((goal) => goal.milestones.filter((milestone) => !milestone.completed).map((milestone) => ({ ...milestone, goalTitle: goal.title, targetDate: goal.targetDate }))).sort((a, b) => (a.targetDate ?? "9999-12-31").localeCompare(b.targetDate ?? "9999-12-31"))[0];
  const allTasks = goals.flatMap((goal) => goal.tasks.map((task) => ({ ...task, goalTitle: goal.title })));
  const nextTask = nextOpenTask(allTasks);
  const habitSnapshot = habitsStatus === "loading"
    ? "Habits: loading today's completions."
    : habits.length
      ? `Habits: ${habitScore}% complete today (${completedHabits} of ${habits.length}).`
      : "Habits: no habits created yet.";
  const schoolSnapshot = schoolStatus === "loading" ? "School goals are loading." : `School goals are averaging ${school}% progress.`;
  const financeSnapshot = financeStatus === "loading"
    ? "Finances are loading."
    : `Finances: ${formatMoney(finance.monthlyIncome)} income, ${formatMoney(finance.monthlyExpenses)} expenses, ${formatMoney(finance.monthlySavings)} saved, and ${formatMoney(finance.monthlyBalance)} monthly balance.`;
  const goalSnapshot = goalsStatus === "loading" ? "Goals are loading." : activeGoals.length ? `Goals: ${activeGoals.length} active with ${averageGoalProgress}% average progress.` : "Goals: no active long-term goals yet.";
  const scheduleSnapshot = calendarStatus === "loading" ? "Schedule is loading." : calendarConnected ? `Schedule: ${todayEvents.length} event${todayEvents.length === 1 ? "" : "s"} today.` : "Schedule: connect Google Calendar for today events.";
  const snapshot = `${healthSnapshot(whoopState)} ${habitSnapshot} ${schoolSnapshot}${nextTask ? ` Next deadline: ${nextTask.title} for ${nextTask.goalTitle} on ${nextTask.dueDate ?? "no date"}.` : " No open school tasks right now."} ${financeSnapshot} ${goalSnapshot} ${scheduleSnapshot}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep / recovery" value={sleepCard.value} detail={sleepCard.detail} icon={HeartPulse} />
        <StatCard label="Habit completion" value={habitValue} detail={habitDetail} icon={CalendarCheck} tone="sky" />
        <StatCard label="School progress" value={schoolValue} detail={schoolStatus === "loading" ? "Loading school goals" : "Average progress across goals"} icon={BookOpen} tone="gold" />
        <StatCard label="Monthly balance" value={financeStatus === "loading" ? "Loading" : formatMoney(finance.monthlyBalance)} detail={financeStatus === "loading" ? "Loading finance data" : `${formatMoney(finance.monthlySavings)} saved this month`} icon={PiggyBank} tone="clay" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Active goals" value={goalsStatus === "loading" ? "Loading" : String(activeGoals.length)} detail="Long-term goals in progress" icon={Target} tone="sky" />
        <StatCard label="Goal progress" value={goalsStatus === "loading" ? "Loading" : `${averageGoalProgress}%`} detail="Average active goal progress" icon={Flag} tone="gold" />
        <StatCard label="Closest milestone" value={goalsStatus === "loading" ? "Loading" : closestMilestone ? closestMilestone.title : "None"} detail={closestMilestone ? closestMilestone.goalTitle : "Add milestones to track next steps"} icon={Target} tone="clay" />
      </div>

      <div className="mt-6">
        <StatCard label="Today schedule" value={calendarStatus === "loading" ? "Loading" : calendarConnected ? String(todayEvents.length) : "Connect"} detail={calendarConnected && todayEvents[0] ? todayEvents[0].title : calendarConnected ? "No events today" : "Connect Google Calendar"} icon={CalendarDays} tone="sky" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        {recoveryTrendPanel({ state: whoopState })}
        <DailyReportDashboardCard />
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


