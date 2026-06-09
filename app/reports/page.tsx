"use client";

import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useHabits } from "@/components/useHabits";
import { initialSchoolGoals, initialTransactions, today, whoopMetrics } from "@/lib/mock-data";
import { generateDailyReport } from "@/lib/report";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function ReportsPage() {
  const { habits, status: habitsStatus } = useHabits();
  const [goals] = useLocalStorageState("life-os-school-goals", initialSchoolGoals);
  const [transactions] = useLocalStorageState("life-os-transactions", initialTransactions);
  const report = generateDailyReport({
    metrics: whoopMetrics,
    habits: habits.map((habit) => ({
      id: habit.id,
      name: habit.title,
      target: habit.description ?? habit.targetFrequency,
      completions: habit.completionDates,
      streak: habit.streak
    })),
    goals,
    transactions,
    date: today
  });

  return (
    <>
      <SectionHeader eyebrow="Daily report" title="Reflection for today" />
      <div className="grid gap-4">
        <ReportCard title="Health and sleep" body={report.health} />
        <ReportCard title="Habits" body={habitsStatus === "loading" ? "Loading today's habit data." : report.habits} />
        <ReportCard title="School goals" body={report.school} />
        <ReportCard title="Finances" body={report.finances} />
        <section className="rounded-lg border border-moss/20 bg-mint p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-moss">Recommendation for tomorrow</h2>
          <p className="leading-7 text-ink/75">{habitsStatus === "loading" ? "Loading your habit check-in now." : report.recommendation}</p>
        </section>
      </div>
    </>
  );
}
