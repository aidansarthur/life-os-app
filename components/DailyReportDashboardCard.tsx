"use client";

import { Brain, Target } from "lucide-react";
import { useDailyReport } from "@/components/useDailyReport";

function focusClass(level: string) {
  if (level === "High") return "bg-moss text-white";
  if (level === "Low") return "bg-clay/10 text-clay";
  return "bg-gold/25 text-ink";
}

export function DailyReportDashboardCard() {
  const { report, status, error } = useDailyReport();

  if (status === "loading") {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="size-5 text-moss" />
          <h2 className="text-lg font-bold">Today's Report</h2>
        </div>
        <p className="text-sm font-semibold text-ink/60">Generating today's report...</p>
      </section>
    );
  }

  if (status === "error" || !report) {
    return (
      <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="size-5 text-moss" />
          <h2 className="text-lg font-bold">Today's Report</h2>
        </div>
        <p className="rounded-md bg-clay/10 p-3 text-sm font-semibold text-clay">Unable to load today's report{error ? `: ${error}` : ""}.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-moss" />
          <h2 className="text-lg font-bold">Today's Report</h2>
        </div>
        <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${focusClass(report.suggestedFocusLevel)}`}>{report.suggestedFocusLevel} focus</span>
      </div>

      <div className="mb-5 rounded-md bg-[#f7f8f4] p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <Target className="size-4 text-moss" />
          Top Priorities
        </div>
        <ol className="space-y-2 text-sm font-semibold text-ink/70">
          {report.topPriorities.map((priority, index) => (
            <li key={priority} className="flex gap-2">
              <span className="text-moss">{index + 1}.</span>
              <span>{priority}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-4 text-sm leading-6 text-ink/75">
        <ReportSection title="Health Summary" body={report.healthSummary} />
        <ReportSection title="Productivity Summary" body={report.productivitySummary} />
        <ReportSection title="Finance Summary" body={report.financeSummary} />
      </div>
    </section>
  );
}

function ReportSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/45">{title}</h3>
      <p>{body}</p>
    </div>
  );
}
