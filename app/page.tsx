"use client";

import { Activity, BookOpen, CalendarCheck, HeartPulse, PiggyBank } from "lucide-react";
import { MiniBarChart } from "@/components/MiniBarChart";
import { ProgressBar } from "@/components/ProgressBar";
import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCard } from "@/components/StatCard";
import { averageProgress, financeSummary, habitCompletion, latestMetric } from "@/lib/calculations";
import { generateDailyReport } from "@/lib/report";
import { initialHabits, initialSchoolGoals, initialTransactions, today, whoopMetrics } from "@/lib/mock-data";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function DashboardPage() {
  const [habits] = useLocalStorageState("life-os-habits", initialHabits);
  const [goals] = useLocalStorageState("life-os-school-goals", initialSchoolGoals);
  const [transactions] = useLocalStorageState("life-os-transactions", initialTransactions);
  const metric = latestMetric(whoopMetrics);
  const habitScore = habitCompletion(habits, today);
  const school = averageProgress(goals);
  const finances = financeSummary(transactions);
  const report = generateDailyReport({
    metrics: whoopMetrics,
    habits,
    goals,
    transactions,
    date: today
  });

  return (
    <>
      <SectionHeader eyebrow="Today" title="Your Life OS dashboard" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sleep / recovery" value={`${metric.recoveryScore}%`} detail={`${metric.sleepHours}h sleep, ${metric.hrv} ms HRV`} icon={HeartPulse} />
        <StatCard label="Habit completion" value={`${habitScore}%`} detail={`${habits.filter((habit) => habit.completions.includes(today)).length} of ${habits.length} daily habits complete`} icon={CalendarCheck} tone="sky" />
        <StatCard label="School progress" value={`${school}%`} detail="Average progress across goals" icon={BookOpen} tone="gold" />
        <StatCard label="Monthly balance" value={`$${finances.balance}`} detail={`$${finances.savings} saved this month`} icon={PiggyBank} tone="clay" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <MiniBarChart data={whoopMetrics} valueKey="recoveryScore" label="Recovery trend" max={100} />
        <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="size-5 text-moss" />
            <h2 className="text-lg font-bold">Daily AI report</h2>
          </div>
          <p className="leading-7 text-ink/75">{report.recommendation}</p>
          <div className="mt-5 space-y-4">
            <ProgressBar value={habitScore} label="Habits" />
            <ProgressBar value={school} label="School goals" />
            <ProgressBar value={Math.min(100, Math.round((finances.savings / 300) * 100))} label="Savings target" />
          </div>
        </section>
      </div>

      <div className="mt-6">
        <ReportCard title="Snapshot" body={`${report.health} ${report.habits} ${report.school}`} />
      </div>
    </>
  );
}
