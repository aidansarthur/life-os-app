export type GoalCategory = "Fitness" | "School" | "Finance" | "Career" | "Personal" | "Faith" | "Custom";

export type GoalMilestoneSummary = {
  id: string;
  goalId: string;
  title: string;
  targetValue: number;
  completed: boolean;
  createdAt: string;
};

export type GoalSummary = {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  expectedProgress: number | null;
  scheduleStatus: "ahead" | "behind" | "on_track" | "no_target";
  milestones: GoalMilestoneSummary[];
};

export type GoalsResponse =
  | { ok: true; goals: GoalSummary[] }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };
