export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  weeklyHealthSummary: string;
  averageRecovery: number | null;
  averageSleepPerformance: number | null;
  habitCompletionRate: number;
  schoolProgressSummary: string;
  financeSummary: string;
  weeklyGoalProgress: string;
  biggestGoalAchievement: string;
  mostNeglectedGoal: string;
  biggestWin: string;
  biggestConcern: string;
  topPriorities: string[];
};

export type WeeklyReportResponse =
  | { ok: true; report: WeeklyReport }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };

