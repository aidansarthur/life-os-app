import Link from "next/link";
import { CalendarDays, ChevronRight, ListChecks } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";

const reports = [
  {
    href: "/reports/daily",
    title: "Daily Report",
    description: "Today summary, top priorities, health, productivity, and finance guidance.",
    icon: ListChecks
  },
  {
    href: "/reports/weekly",
    title: "Weekly Report",
    description: "Seven-day review across WHOOP, habits, school, and finances.",
    icon: CalendarDays
  }
];

export default function ReportsPage() {
  return (
    <>
      <SectionHeader eyebrow="Reports" title="Daily and weekly reviews" />
      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href} className="focus-ring group rounded-lg border border-ink/10 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-moss/30">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="grid size-10 place-items-center rounded-md bg-mint text-moss">
                  <Icon className="size-5" />
                </div>
                <ChevronRight className="size-5 text-ink/35 transition group-hover:text-moss" />
              </div>
              <h2 className="text-lg font-bold text-ink">{report.title}</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">{report.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
