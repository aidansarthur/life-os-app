export type WhoopMetric = {
  date: string;
  sleepHours: number;
  recoveryScore: number;
  hrv: number;
  restingHeartRate: number;
  strain: number;
};

export type Habit = {
  id: string;
  name: string;
  target: string;
  completions: string[];
  streak: number;
};

export type SchoolGoal = {
  id: string;
  className: string;
  target: string;
  progress: number;
  priority: "Low" | "Medium" | "High";
  tasks: SchoolTask[];
};

export type SchoolTask = {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
};

export type FinancialTransaction = {
  id: string;
  date: string;
  type: "Income" | "Expense" | "Savings";
  category: string;
  amount: number;
  note: string;
};
