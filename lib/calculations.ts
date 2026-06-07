import type { FinancialTransaction, Habit, SchoolGoal, WhoopMetric } from "./types";

export function habitCompletion(habits: Habit[], date: string) {
  if (!habits.length) return 0;
  const complete = habits.filter((habit) => habit.completions.includes(date)).length;
  return Math.round((complete / habits.length) * 100);
}

export function averageProgress(goals: SchoolGoal[]) {
  if (!goals.length) return 0;
  return Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length);
}

export function financeSummary(transactions: FinancialTransaction[]) {
  const income = transactions.filter((item) => item.type === "Income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.type === "Expense").reduce((sum, item) => sum + item.amount, 0);
  const savings = transactions.filter((item) => item.type === "Savings").reduce((sum, item) => sum + item.amount, 0);
  return { income, expenses, savings, balance: income - expenses - savings };
}

export function categorySpend(transactions: FinancialTransaction[]) {
  return transactions
    .filter((item) => item.type === "Expense")
    .reduce<Record<string, number>>((groups, item) => {
      groups[item.category] = (groups[item.category] ?? 0) + item.amount;
      return groups;
    }, {});
}

export function latestMetric(metrics: WhoopMetric[]) {
  return metrics[metrics.length - 1] ?? {
    date: "Today",
    sleepHours: 0,
    recoveryScore: 0,
    hrv: 0,
    restingHeartRate: 0,
    strain: 0
  };
}
