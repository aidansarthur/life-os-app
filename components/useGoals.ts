"use client";

import { useCallback, useEffect, useState } from "react";
import type { GoalSummary, GoalsResponse } from "@/lib/goal-types";

type GoalsStatus = "loading" | "ready" | "error";
type GoalInput = { title: string; description?: string; category?: string; targetValue?: number; currentValue?: number; unit?: string; targetDate?: string; status?: string };
type MilestoneInput = { title: string; targetValue?: number };

export function useGoals() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [status, setStatus] = useState<GoalsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/goals", { cache: "no-store" });
      const data = (await response.json()) as GoalsResponse;
      if (!response.ok || !data.ok) {
        setStatus("error");
        setError(data.ok ? "request_failed" : data.error);
        return;
      }
      setGoals(data.goals);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("request_failed");
    }
  }, []);

  useEffect(() => { void loadGoals(); }, [loadGoals]);

  const createGoal = useCallback(async (input: GoalInput) => {
    const response = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    const data = (await response.json()) as GoalsResponse;
    if (!response.ok || !data.ok) {
      setStatus("error");
      setError(data.ok ? "request_failed" : data.error);
      return false;
    }
    setGoals(data.goals);
    setStatus("ready");
    setError(null);
    return true;
  }, []);

  const updateGoal = useCallback(async (id: string, input: GoalInput) => {
    const response = await fetch(`/api/goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }
    await loadGoals();
    return true;
  }, [loadGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    const response = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }
    setGoals((items) => items.filter((item) => item.id !== id));
    return true;
  }, []);

  const createMilestone = useCallback(async (goalId: string, input: MilestoneInput) => {
    const response = await fetch(`/api/goals/${goalId}/milestones`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }
    await loadGoals();
    return true;
  }, [loadGoals]);

  const completeMilestone = useCallback(async (id: string) => {
    const response = await fetch(`/api/goals/milestones/${id}/complete`, { method: "POST" });
    if (!response.ok) {
      setStatus("error");
      setError("request_failed");
      return false;
    }
    await loadGoals();
    return true;
  }, [loadGoals]);

  return { goals, status, error, loadGoals, createGoal, updateGoal, deleteGoal, createMilestone, completeMilestone };
}
