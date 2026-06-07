import { averageProgress, financeSummary, habitCompletion, latestMetric } from "./calculations";
import type { FinancialTransaction, Habit, SchoolGoal, WhoopMetric } from "./types";

export function generateDailyReport(input: {
  metrics: WhoopMetric[];
  habits: Habit[];
  goals: SchoolGoal[];
  transactions: FinancialTransaction[];
  date: string;
}) {
  const todayMetric = latestMetric(input.metrics);
  const habitScore = habitCompletion(input.habits, input.date);
  const schoolScore = averageProgress(input.goals);
  const money = financeSummary(input.transactions);
  const missedHabits = input.habits.filter((habit) => !habit.completions.includes(input.date));
  const nextTask = input.goals.flatMap((goal) => goal.tasks.map((task) => ({ ...task, className: goal.className })))
    .filter((task) => !task.done)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const bestStreak = input.habits.length ? Math.max(...input.habits.map((habit) => habit.streak)) : 0;

  let recommendation = "Keep the plan simple tomorrow: one workout, one focused school block, and one early bedtime cue.";
  if (todayMetric.recoveryScore < 70) {
    recommendation = "Protect recovery tomorrow with an easier training load and a firm bedtime.";
  } else if (habitScore < 75) {
    recommendation = `Start tomorrow with ${missedHabits[0]?.name ?? "your first habit"} before your day gets noisy.`;
  } else if (nextTask) {
    recommendation = `Put a focused block on ${nextTask.className}: ${nextTask.title}.`;
  }

  // TODO: Replace this rule-based summary with an OpenAI-powered report once API auth,
  // user consent, and data syncing are connected.
  return {
    health: `You slept ${todayMetric.sleepHours} hours with a ${todayMetric.recoveryScore}% recovery score, ${todayMetric.hrv} ms HRV, and ${todayMetric.strain} strain.`,
    habits: `${habitScore}% of today's habits are complete. Your strongest streak is ${bestStreak} days.`,
    school: `School goals are averaging ${schoolScore}% progress. ${nextTask ? `Next deadline: ${nextTask.title} for ${nextTask.className} on ${nextTask.dueDate}.` : "No open tasks right now."}`,
    finances: `This month: $${money.income} income, $${money.expenses} expenses, $${money.savings} saved, and $${money.balance} remaining after savings.`,
    recommendation
  };
}
