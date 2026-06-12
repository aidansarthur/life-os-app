"use client";

import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useWeeklyReport } from "@/components/useWeeklyReport";

function formatPercent(value: number | null) {
  return value === null ? "--" : `${value}%`;
}

export default function WeeklyReportPage() {
  const { report, status, error } = useWeeklyReport();

  return (
    <>
      <SectionHeader eyebrow="Weekly report" title="Seven-day review" />
      {status === "loading" ? <StatusCard message="Generating weekly report..." /> : null}
      {status === "error" ? <StatusCard message={`Unable to load weekly report${error ? `: ${error}` : ""}.`} tone="error" /> : null}
      {report ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Average recovery" value={formatPercent(report.averageRecovery)} />
            <MetricCard label="Sleep performance" value={formatPercent(report.averageSleepPerformance)} />
            <MetricCard label="Habit completion" value={`${report.habitCompletionRate}%`} />
          </div>

          <section className="rounded-lg border border-moss/20 bg-mint p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-moss">Top priorities for next week</h2>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{report.weekStart} to {report.weekEnd}</span>
            </div>
            <ol className="space-y-2 text-sm font-semibold text-ink/75">
              {report.topPriorities.map((priority, index) => (
                <li key={priority} className="flex gap-2">
                  <span className="text-moss">{index + 1}.</span>
                  <span>{priority}</span>
                </li>
              ))}
            </ol>
          </section>

          <ReportCard title="Weekly health summary" body={report.weeklyHealthSummary} />
          <ReportCard title="School progress" body={report.schoolProgressSummary} />
          <ReportCard title="Finance summary" body={report.financeSummary} />
          <div className="grid gap-4 md:grid-cols-2">
            <ReportCard title="Biggest win" body={report.biggestWin} />
            <ReportCard title="Biggest concern" body={report.biggestConcern} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </section>
  );
}

function StatusCard({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return <section className={`rounded-lg border p-5 text-sm font-semibold shadow-soft ${tone === "error" ? "border-clay/20 bg-clay/10 text-clay" : "border-ink/10 bg-white text-ink/60"}`}>{message}</section>;
}
