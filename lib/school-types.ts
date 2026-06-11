export type SchoolTaskSummary = {
  id: string;
  goalId: string;
  title: string;
  dueDate: string | null;
  priority: "Low" | "Medium" | "High";
  status: "open" | "completed";
  createdAt: string;
  updatedAt: string;
};

export type SchoolGoalSummary = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: "Low" | "Medium" | "High";
  progress: number;
  createdAt: string;
  updatedAt: string;
  tasks: SchoolTaskSummary[];
};

export type SchoolResponse =
  | { ok: true; goals: SchoolGoalSummary[] }
  | { ok: false; error: "not_authenticated" | "supabase_not_configured" | "request_failed" };
