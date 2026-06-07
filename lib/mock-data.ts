import type { FinancialTransaction, Habit, SchoolGoal, WhoopMetric } from "./types";

export const today = "2026-06-06";

export const whoopMetrics: WhoopMetric[] = [
  { date: "Mon", sleepHours: 7.1, recoveryScore: 71, hrv: 67, restingHeartRate: 54, strain: 10.7 },
  { date: "Tue", sleepHours: 6.4, recoveryScore: 63, hrv: 61, restingHeartRate: 57, strain: 13.2 },
  { date: "Wed", sleepHours: 8.0, recoveryScore: 82, hrv: 74, restingHeartRate: 52, strain: 9.4 },
  { date: "Thu", sleepHours: 7.5, recoveryScore: 77, hrv: 70, restingHeartRate: 53, strain: 12.1 },
  { date: "Fri", sleepHours: 6.8, recoveryScore: 66, hrv: 63, restingHeartRate: 56, strain: 14.6 },
  { date: "Sat", sleepHours: 7.7, recoveryScore: 79, hrv: 72, restingHeartRate: 52, strain: 8.8 }
];

export const initialHabits: Habit[] = [
  { id: "pray", name: "Pray", target: "Daily morning reset", completions: [today], streak: 6 },
  { id: "bible", name: "Bible reading", target: "One chapter", completions: [today], streak: 4 },
  { id: "lift", name: "Lift", target: "4x/week", completions: [], streak: 2 },
  { id: "soccer", name: "Soccer training", target: "Touches or conditioning", completions: [today], streak: 5 },
  { id: "study", name: "Study", target: "90 focused minutes", completions: [today], streak: 7 },
  { id: "sleep", name: "Sleep by target time", target: "In bed by 10:30", completions: [], streak: 1 }
];

export const initialSchoolGoals: SchoolGoal[] = [
  {
    id: "calc",
    className: "AP Calc",
    target: "Master derivatives and integrals",
    progress: 64,
    priority: "High",
    tasks: [
      { id: "calc-1", title: "Finish review packet", dueDate: "2026-06-08", done: false },
      { id: "calc-2", title: "Redo missed quiz problems", dueDate: "2026-06-10", done: true }
    ]
  },
  {
    id: "gov",
    className: "AP Gov",
    target: "Build concise court case notes",
    progress: 48,
    priority: "Medium",
    tasks: [{ id: "gov-1", title: "Summarize federalism cases", dueDate: "2026-06-09", done: false }]
  },
  {
    id: "sat",
    className: "SAT/ACT prep",
    target: "Raise math and reading consistency",
    progress: 56,
    priority: "High",
    tasks: [{ id: "sat-1", title: "Take timed math section", dueDate: "2026-06-07", done: false }]
  },
  {
    id: "college",
    className: "College applications",
    target: "Draft strong activities list",
    progress: 30,
    priority: "Medium",
    tasks: [{ id: "college-1", title: "Write first activity descriptions", dueDate: "2026-06-14", done: false }]
  },
  {
    id: "engineering",
    className: "Engineering prep",
    target: "Complete small build portfolio projects",
    progress: 42,
    priority: "Low",
    tasks: [{ id: "eng-1", title: "Outline summer CAD project", dueDate: "2026-06-12", done: false }]
  }
];

export const initialTransactions: FinancialTransaction[] = [
  { id: "t1", date: "2026-06-01", type: "Income", category: "Job", amount: 320, note: "Paycheck" },
  { id: "t2", date: "2026-06-02", type: "Expense", category: "Food", amount: 38, note: "Lunches" },
  { id: "t3", date: "2026-06-03", type: "Expense", category: "Gas", amount: 42, note: "Car" },
  { id: "t4", date: "2026-06-04", type: "Savings", category: "College", amount: 120, note: "Auto savings" },
  { id: "t5", date: "2026-06-05", type: "Expense", category: "School", amount: 24, note: "Supplies" }
];
