export type DailyReport = {
  date: string;
  healthSummary: string;
  productivitySummary: string;
  financeSummary: string;
  topPriorities: string[];
  suggestedFocusLevel: "Low" | "Moderate" | "High";
};

export type DailyReportResponse =
  | { ok: true; report: DailyReport }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };
