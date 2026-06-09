export type HabitSummary = {
  id: string;
  title: string;
  description: string | null;
  targetFrequency: string;
  createdAt: string;
  completedToday: boolean;
  streak: number;
  completionDates: string[];
};

export type HabitsResponse =
  | { ok: true; habits: HabitSummary[] }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };
