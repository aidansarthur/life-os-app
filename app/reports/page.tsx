"use client";

import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useHabits } from "@/components/useHabits";
import { useSchool } from "@/components/useSchool";
import { initialTransactions, today, whoopMetrics } from "@/lib/mock-data";
import { generateDailyReport } from "@/lib/report";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function ReportsPage() {
  const { habits, status: habitsStatus } = useHabits();
  const { goals, status: schoolStatus } = useSchool();
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
    goals: goals.map((goal) => ({
      id: goal.id,
      className: goal.title,
      target: goal.description ?? goal.category,
      priority: goal.priority,
      progress: goal.progress,
      tasks: goal.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate ?? "",
        done: task.status === "completed"
      }))
    })),
    transactions,
    date: today
  });

  return (
    <>
      <SectionHeader eyebrow="Daily report" title="Reflection for today" />
      <div className="grid gap-4">
        <ReportCard title="Health and sleep" body={report.health} />
        <ReportCard title="Habits" body={habitsStatus === "loading" ? "Loading today's habit data." : report.habits} />
        <ReportCard title="School goals" body={schoolStatus === "loading" ? "Loading school goals." : report.school} />
        <ReportCard title="Finances" body={report.finances} />
        <section className="rounded-lg border border-moss/20 bg-mint p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-moss">Recommendation for tomorrow</h2>
          <p className="leading-7 text-ink/75">{habitsStatus === "loading" || schoolStatus === "loading" ? "Loading your check-in now." : report.recommendation}</p>
        </section>
      </div>
    </>
  );
}
