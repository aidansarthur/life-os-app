"use client";

import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { generateDailyReport } from "@/lib/report";
import { initialHabits, initialSchoolGoals, initialTransactions, today, whoopMetrics } from "@/lib/mock-data";
import { useLocalStorageState } from "@/lib/use-local-storage";

export default function ReportsPage() {
  const [habits] = useLocalStorageState("life-os-habits", initialHabits);
  const [goals] = useLocalStorageState("life-os-school-goals", initialSchoolGoals);
  const [transactions] = useLocalStorageState("life-os-transactions", initialTransactions);
  const report = generateDailyReport({
    metrics: whoopMetrics,
    habits,
    goals,
    transactions,
    date: today
  });

  return (
    <>
      <SectionHeader eyebrow="Daily report" title="Reflection for today" />
      <div className="grid gap-4">
        <ReportCard title="Health and sleep" body={report.health} />
        <ReportCard title="Habits" body={report.habits} />
        <ReportCard title="School goals" body={report.school} />
        <ReportCard title="Finances" body={report.finances} />
        <section className="rounded-lg border border-moss/20 bg-mint p-5">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-moss">Recommendation for tomorrow</h2>
          <p className="leading-7 text-ink/75">{report.recommendation}</p>
        </section>
      </div>
    </>
  );
}
