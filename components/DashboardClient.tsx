"use client";

import { Activity, BookOpen, CalendarCheck, HeartPulse, PiggyBank } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ProgressBar } from "@/components/ProgressBar";
import { ReportCard } from "@/components/ReportCard";
import { StatCard } from "@/components/StatCard";
import { WhoopDashboardWidget } from "@/components/WhoopDashboardWidget";
import { useWhoopDashboard } from "@/components/useWhoopDashboard";
import { averageProgress, financeSummary, habitCompletion } from "@/lib/calculations";
import { initialHabits, initialSchoolGoals, initialTransactions, today } from "@/lib/mock-data";
import { useLocalStorageState } from "@/lib/use-local-storage";
import type { WhoopDashboardState } from "@/lib/whoop-dashboard-types";

function formatPercent(value: number | null) {
  return value === null ? "--" : `${Math.round(value)}%`;
}

function formatHours(value: number | null) {
  return value === null ? "--" : `${value.toFixed(1)}h`;
}

function formatHrv(value: number | null) {
  return value === null ? "--" : `${Math.round(value)} ms HRV`;
}

function sleepRecoveryCard(state: WhoopDashboardState) {
  if (state.status === "connected") {
    return {
      value: formatPercent(state.metrics.recoveryScore),
      detail: `${formatHours(state.metrics.hoursSlept)} sleep, ${formatHrv(state.metrics.hrv)}`
    };
  }

  if (state.status === "loading") {
    return {
      value: "Loading",
      detail: "Fetching WHOOP recovery and sleep"
    };
  }

  if (state.status === "not_connected") {
    return {
      value: "Connect",
      detail: "Connect WHOOP for recovery and sleep"
    };
  }

  return {
    value: "--",
    detail: "Unable to load WHOOP data"
  };
}

function healthSnapshot(state: WhoopDashboardState) {
  if (state.status === "connected") {
    return `WHOOP: ${formatPercent(state.metrics.recoveryScore)} recovery, ${formatHours(state.metrics.hoursSlept)} slept, ${formatHrv(state.metrics.hrv)}, ${state.metrics.restingHeartRate === null ? "--" : `${Math.round(state.metrics.restingHeartRate)} bpm resting HR`}, and ${formatPercent(state.metrics.sleepEfficiency)} sleep efficiency.`;
  }

  if (state.status === "loading") {
    return "WHOOP: loading recovery and sleep data.";
  }

  if (state.status === "not_connected") {
    return "WHOOP: connect your account to show live recovery, sleep, HRV, resting heart rate, and sleep efficiency.";
  }

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

export function DashboardClient() {
  const [habits] = useLocalStorageState("life-os-habits", initialHabits);
  const [goals] = useLocalStorageState("life-os-school-goals", initialSchoolGoals);
  const [transactions] = useLocalStorageState("life-os-transactions", initialTransactions);
  const whoopState = useWhoopDashboard();
  const sleepCard = sleepRecoveryCard(whoopState);
  const habitScore = habitCompletion(habits, today);
  const school = averageProgress(goals);
  const finances = financeSummary(transactions);
  const completedHabits = habits.filter((habit) => habit.completions.includes(today)).length;
  const nextTask = goals
    .flatMap((goal) => goal.tasks.map((task) => ({ ...task, className: goal.className })))
    .filter((task) => !task.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const recommendation = habitScore < 75
    ? "Start tomorrow with your first unfinished habit before the day gets crowded."
    : nextTask
      ? `Put one focused block on ${nextTask.className}: ${nextTask.title}.`
      : "Keep the plan simple tomorrow: habits, one focused study block, and a clean money check-in.";
  const snapshot = `${healthSnapshot(whoopState)} Habits: ${habitScore}% complete today (${completedHabits} of ${habits.length}). School goals are averaging ${school}% progress.${nextTask ? ` Next deadline: ${nextTask.title} for ${nextTask.className} on ${nextTask.dueDate}.` : " No open school tasks right now."}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep / recovery" value={sleepCard.value} detail={sleepCard.detail} icon={HeartPulse} />
        <StatCard label="Habit completion" value={`${habitScore}%`} detail={`${completedHabits} of ${habits.length} daily habits complete`} icon={CalendarCheck} tone="sky" />
        <StatCard label="School progress" value={`${school}%`} detail="Average progress across goals" icon={BookOpen} tone="gold" />
        <StatCard label="Monthly balance" value={`$${finances.balance}`} detail={`$${finances.savings} saved this month`} icon={PiggyBank} tone="clay" />
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
            <ProgressBar value={Math.min(100, Math.round((finances.savings / 300) * 100))} label="Savings target" />
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
