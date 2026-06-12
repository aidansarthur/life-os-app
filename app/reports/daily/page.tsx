"use client";

import { ReportCard } from "@/components/ReportCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useDailyReport } from "@/components/useDailyReport";

export default function DailyReportPage() {
  const { report, status, error } = useDailyReport();

  return (
    <>
      <SectionHeader eyebrow="Daily report" title="Today Report" />
      {status === "loading" ? <StatusCard message="Generating today report..." /> : null}
      {status === "error" ? <StatusCard message={`Unable to load daily report${error ? `: ${error}` : ""}.`} tone="error" /> : null}
      {report ? (
        <div className="grid gap-4">
          <section className="rounded-lg border border-moss/20 bg-mint p-5">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-moss">Top priorities</h2>
            <ol className="space-y-2 text-sm font-semibold text-ink/75">
              {report.topPriorities.map((priority, index) => (
                <li key={priority} className="flex gap-2">
                  <span className="text-moss">{index + 1}.</span>
                  <span>{priority}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">Suggested focus: {report.suggestedFocusLevel}</p>
          </section>
          <ReportCard title="Health summary" body={report.healthSummary} />
          <ReportCard title="Productivity summary" body={report.productivitySummary} />
          <ReportCard title="Finance summary" body={report.financeSummary} />
        </div>
      ) : null}
    </>
  );
}

function StatusCard({ message, tone = "default" }: { message: string; tone?: "default" | "error" }) {
  return <section className={`rounded-lg border p-5 text-sm font-semibold shadow-soft ${tone === "error" ? "border-clay/20 bg-clay/10 text-clay" : "border-ink/10 bg-white text-ink/60"}`}>{message}</section>;
}
